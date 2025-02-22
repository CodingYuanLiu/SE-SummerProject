import * as React from "react";
import {StatusBar} from "react-native";
import { createAppContainer } from 'react-navigation';
import {FirstLoginNav, MainNav, UsernameEmptyNav} from './navigator/AppNav';
import {Provider} from 'react-redux';
import store from "./store/index"
import LocalApi from "./api/LocalApi";
import Api from "./api/Api";
import {LOGIN_STATUS} from "./common/constant/Constant";
import {onGetCurrentUserFollower} from "./actions/currentUserFollower";
import {onGetCurrentUserFollowing} from "./actions/currentUserFollowing";
import {onGetCurrentUserManageAct} from "./actions/currentUserManage";
import {onGetCurrentUserJoinAct} from "./actions/currentUserJoin";
import {setUserData} from "./actions/currentUser";
import XmppApi from "./api/XmppApi";
import {onLoadSettings, setCity} from "./actions/setting";
import {PermissionsAndroid} from "react-native";
import Util from "./common/util";
import {Geolocation, init} from "react-native-amap-geolocation/lib/js";


var base64 = require('base-64');
global.btoa = base64.encode;
global.atob = base64.decode;

const FirstLoginApp = createAppContainer(FirstLoginNav);
const UsernameEmptyApp = createAppContainer(UsernameEmptyNav);
const MainApp = createAppContainer(MainNav);
export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loginStatus: LOGIN_STATUS.WAITING,
        }
    }

    componentDidMount() {
        this.login()
            .catch(err => {
                console.log(err);
            });
        this.getPermission()
            .catch();
        init({
            android: "617d2c2e23b1d390b3ab75e14975ec32",
        }).then(() => {
            Geolocation.getCurrentPosition((nativeEvent) => {
                store.dispatch(setCity(nativeEvent.location.city))
            })

        });
        StatusBar.setBackgroundColor("#0084ff", true);
    }

    render() {
        const {loginStatus} = this.state;

        let App;
        switch (loginStatus) {
            case LOGIN_STATUS.WAITING:
                App = null;
                break;
            case LOGIN_STATUS.LOGGED: case LOGIN_STATUS.OFFLINE:
                App = <MainApp/>;
                break;
            case LOGIN_STATUS.FIRST_LOGIN:
                App = <FirstLoginApp/>;
                break;
            case LOGIN_STATUS.USERNAME_EMPTY:
                App = <UsernameEmptyApp/>;
                break;
            default:
                App = null;
        }

        return (
            <Provider store={store}>
                {App}
            </Provider>
        )
    };


    login = async () => {
        try {
            let isFirstLogin = await LocalApi.getFirstLogin();
            if (isFirstLogin) {
                this.setState({
                    loginStatus: LOGIN_STATUS.FIRST_LOGIN
                });
                await LocalApi.saveFirstLogin(false);
                return;
            }
            let jwt = await LocalApi.getToken();
            let data = await Api.getSelfDetail(jwt);
            Util.TOKEN = jwt; Util.HAS_ACCOUNT_FLAG = data.username === "";
            store.dispatch(onGetCurrentUserFollower(jwt));
            store.dispatch(onGetCurrentUserFollowing(jwt));
            store.dispatch(onGetCurrentUserManageAct(jwt));
            store.dispatch(onGetCurrentUserJoinAct(jwt));
            store.dispatch(setUserData(data));
            store.dispatch(onLoadSettings());
            await XmppApi.login(data);
            await XmppApi.onStanza(store, data);
            if (data.username === "") {
                this.setState({
                    loginStatus: LOGIN_STATUS.USERNAME_EMPTY,
                })
            } else {
                this.setState({
                    loginStatus: LOGIN_STATUS.LOGGED,
                });
            }



        }catch (e) {
            this.setState({
                loginStatus: LOGIN_STATUS.OFFLINE
            });
            console.log(e);
        }
    };
    getPermission = async () => {
        try {
            let permissions = [
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,

            ];
            const permissionResponse = await PermissionsAndroid.requestMultiple(
                permissions,
            );

        } catch (e) {
            console.log(e);
        }
    };
}

