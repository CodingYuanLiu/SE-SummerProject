import React from "react";
import {View, Text, StyleSheet, ScrollView, TouchableWithoutFeedback, Animated} from "react-native"
import {Button, Image, ListItem } from "react-native-elements";
import NavigationUtil from "../../navigator/NavUtil";
import {
    ArrowLeftIcon, CaretRightIcon, CheckIcon, ChevronIcon, CloseIcon,
    CommentIcon,
    EditIcon,
    PaperPlaneIcon,
    PlusIcon
} from "../../common/components/Icons";
import Tag from "../../common/components/Tag";
import Activity from "../../actions/activity";
import {connect} from "react-redux";
import Api from "../../api/Api";
import CommentPreview from "./components/CommentPreview";
import {onFollow, onUnFollow} from "../../actions/currentUserFollowing";
import UserAvatar from "../../common/components/UserAvatar";
import UserNickname from "../../common/components/UserNickname";
import HeaderBar from "../../common/components/HeaderBar";
import ToolTip from "../../common/components/ToolTip";
import {
    ACT_TYPE_ORDER, ACT_TYPE_OTHER,
    ACT_TYPE_TAKEOUT,
    ACT_TYPE_TAXI, CHAT_TYPE,
    IS_SPONSOR,
    JOINED,
    JOINING,
    NOT_JOIN, PUBLISH_ACTION,
    REJECTED
} from "../../common/constant/Constant";
import {WINDOW} from "../../common/constant/Constant";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";


class DetailScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state= {
            isLoading: false,
            isFriends: false,
            isJoining: false,
            joinStatus: 0,
            isTooltipVisible: false,
            isImageViewerVisible: false,
            isTitleVisible: false,
            index: 0,
        };
        this.actId = this.props.navigation.getParam("id");
        this.scrollY = new Animated.Value(0);
    }

    componentDidMount(){
        this.loadData(this.actId, this.props.currentUser.jwt,
            this.props.currentUser.id, this.props.currentUserFollowing.items);
    }

    render() {
        let activity = this.props.currentAct;
        let {title, comments, images,
            createTime, description, sponsor} = activity;
        let header = this.renderHeader(title);
        let ActTitle = this.renderTitle(activity);
        let body = this.renderBody(sponsor, description, images, createTime, comments);
        let footer = this.renderFooter();
        let imageViewer = this.renderImageViewer(images);
        return(
            <View style={{flex: 1,}}>
                {header}
                <Animated.ScrollView
                    style={styles.container}
                    onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {y: this.scrollY}}}],
                        {useNativeDriver: true}
                    )}
                >
                    {ActTitle}
                    {body}
                </Animated.ScrollView>
                {footer}
                {imageViewer}
            </View>
        );
    };
    renderHeader = (title) => {
        let leftIcon = (
            <ArrowLeftIcon
                color={"#5a5a5a"}
                onPress={this.goBack}
                size={24}
            />
        );
        let rightIcon = this.renderToolTip();
        return(
            <HeaderBar
                leftButton={leftIcon}
                titleView={
                    <Animated.View
                        style={[
                            styles.headerTitleContainer,
                            {
                                opacity: this.scrollY.interpolate({
                                    inputRange: [0, 50],
                                    outputRange: [0, 1],
                                }),
                                transform: [
                                    {
                                        translateY: this.scrollY.interpolate({
                                            inputRange: [0, 30, 100],
                                            outputRange: [20, 0, 0],
                                        })
                                    }
                                ]
                            }
                        ]}
                    >
                        <Text
                            style={styles.headerTitle}
                        >{title}</Text>
                    </Animated.View>
                }
                titleLayoutStyle={{alignItems: "flex-start"}}
                style={{
                    backgroundColor: "#fff",
                    elevation: 2,
                }}
                rightButton={rightIcon}
            />
        );
    };
    renderToolTip = () => {
        let { currentAct } = this.props;
        let deleteButton = null;
        if (currentAct.isSelf) {
            deleteButton = (
                <Button
                    title={"删除"}
                    type={"clear"}
                    onPress={this.deleteAct}
                />
            )
        }
        let modifyButton = null;
        console.log("currentAct",currentAct);
        if (currentAct.isSelf) {
            modifyButton = (
                <Button
                    title={"编辑"}
                    type={"clear"}
                    onPress={this.modifyAct}
                />
            )
        }
        return (
            <ToolTip
                isVisible={this.state.isTooltipVisible}
                onPress={() => {this.setState({isTooltipVisible: true})}}
                onBackdropPress={() => {this.setState({isTooltipVisible: false})}}
            >
                <Button
                    title={"夜晚模式"}
                    type={"clear"}
                    onPress={this.toggleEveningMode}
                />
                {deleteButton}
                {modifyButton}
            </ToolTip>
        );
    };
    renderTitle = (activity) => {
        let {title, tags,} = activity;
        let spec = this.renderSpecHeader(activity);
        return (
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
                {spec}
                <View style={styles.tagContainer}>
                    {
                        tags && tags.length > 0 ?
                            tags.map((tag, i) => {
                                return(
                                    <Tag
                                        title={tag}
                                        key={i.toString()}
                                    />);
                            }) : null
                    }
                </View>
            </View>
        );
    };
    renderSpecHeader = (activity) => {
        let { type, origin, dest,
            departTime, endTime, store, orderTime, activityTime} = activity;
        let originDestComponent = null;
        let departTimeComponent = null;
        let endTimeComponent;
        let storeComponent = null;
        let orderTimeComponent = null;
        let activityComponent = null;
        endTimeComponent = (
            <Text
                style={styles.specLabel}
            >
                报名截止
                <Text
                    style={styles.specTitle}
                >
                    {`: ${endTime}`}
                </Text>
            </Text>
        );
        if (type === ACT_TYPE_OTHER) {
            activityComponent = (
                <Text
                    style={styles.specLabel}
                >
                    活动开始
                    <Text
                        style={styles.specTitle}
                    >
                        {`: ${activityTime}`}
                    </Text>
                </Text>
            )
        } else if (type === ACT_TYPE_ORDER) {
            storeComponent = (
                <Text
                    style={styles.specLabel}
                >
                    网购店铺
                    <Text
                        style={styles.specTitle}
                    >
                        {`: ${store}`}
                    </Text>
                </Text>
            )
        } else if (type === ACT_TYPE_TAKEOUT) {
            orderTimeComponent = (
                <Text
                    style={styles.specLabel}
                >
                    下单时间
                    <Text
                        style={styles.specTitle}
                    >
                        {`: ${orderTime}`}
                    </Text>
                </Text>
            );
            storeComponent = (
                <Text
                    style={styles.specLabel}
                >
                    下单店铺
                    <Text
                        style={styles.specTitle}
                    >
                        {`: ${store}`}
                    </Text>
                </Text>
            )
        } else if (type === ACT_TYPE_TAXI) {
            departTimeComponent = (
                <Text
                    style={styles.specLabel}
                >
                    出发时间
                    <Text
                        style={styles.specTitle}
                    >
                        {`: ${departTime}`}
                    </Text>
                </Text>
            );
            originDestComponent = (
                <View>
                    <Text
                        style={styles.specLabel}
                    >
                        {`出发到达: `}
                    </Text>
                    <TouchableWithoutFeedback
                        onPress={this.toTaxiOriginDestDetail}
                    >
                        <View
                            style={{flexDirection: "row", flex: 1,alignItems: "center"}}
                        >
                            <Text
                                ellipsizeMode={"middle"}
                                numberOfLines={1}
                                style={[styles.specTitle, {flex: 1,}]}
                            >
                                {`${origin.title}`}
                            </Text>
                            <CaretRightIcon
                                color={"#8f8f8f"}
                                size={18}
                            />
                            <Text
                                ellipsizeMode={"middle"}
                                numberOfLines={1}
                                style={[styles.specTitle, {flex: 1,}]}
                            >
                                {` ${dest.title}`}
                            </Text>
                            <ChevronIcon
                                size={18}
                                color={"#afafaf"}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            )
        } else {
            // ....
        }

        return (
            <View
                style={styles.specContainer}
            >
                {endTimeComponent}
                {activityComponent}
                {departTimeComponent}
                {orderTimeComponent}
                {storeComponent}
                {originDestComponent}
            </View>
        )
    };
    renderBody = (sponsor, description, images, createTime, comments) => {
        let comment = this.renderComment(comments);
        let sponsorComponent = this.renderSponsor(sponsor);
        let participantList = this.renderParticipantList();
        return (
            <View style={styles.bodyContainer}>
                {sponsorComponent}
                <View>
                    <Text style={styles.bodyText}>{description}</Text>
                </View>
                {images && images.length > 0 ?
                    <View>
                        {
                            images.map((item, i) => {
                                return (
                                    <TouchableWithoutFeedback
                                        onPress={() => {this.setState({
                                            isImageViewerVisible: true,
                                            index: i,
                                        })}}
                                        key={i.toString()}
                                    >
                                        <Image
                                            source={{uri: item}}
                                            style={styles.bodyImage}
                                        />
                                    </TouchableWithoutFeedback>
                                    )
                            })
                        }
                    </View> : null
                }
                <View style={styles.bodyBottomContainer}>
                    <Text style={styles.metadata}>发布于{createTime}</Text>
                </View>
                {participantList}
                {comment}
            </View>

        )
    };
    renderSponsor = sponsor => {
        let followBtn =
            this.props.currentAct.isFriends ?
            <Button
                title={"取消关注"}
                titleStyle={{color: "#9a9a9a"}}
                buttonStyle={styles.followBtn}
                onPress={this.unFollow}
                loading={this.state.isUnFollowing}
                containerStyle={{width: 100,}}
            />:
                <Button
                    title={"关注"}
                    titleStyle={{color: "#0084ff"}}
                    buttonStyle={styles.followBtn}
                    onPress={this.follow}
                    loading={this.state.isFollowing}
                    icon={
                        <PlusIcon
                            size={24}
                            color={"#0084ff"}
                        />
                    }
                    containerStyle={{width: 100,}}
                />;
        let avatar = (
            <UserAvatar
                source={{uri: sponsor.avatar }}
                title={""}
                size={36}
                id={sponsor.id}
            />
        );
        let nickname = (
            <UserNickname
                title={sponsor.nickname}
                id={sponsor.id}
            />
        );
        return (
            <ListItem
                leftAvatar={avatar}
                title={nickname}
                titleProps={{
                    numberOfLines: 1,
                    ellipsizeMode: "tail",
                    onPress: this.toUserPersonalPage
                }}
                titleStyle={styles.userInfoTitle}
                subtitle={sponsor.signature}
                subtitleProps={{ellipsizeMode: "tail", numberOfLines: 1}}
                subtitleStyle={styles.userInfoSubtitle}
                rightElement={this.props.currentAct.isSelf ? null : followBtn}
                containerStyle={styles.userInfoContainer}
                contentContainerStyle={{position: "relative", left: -5}}
            />
        )
    };
    renderParticipantList = () => {
        let { participants } = this.props.currentAct;
        if (!participants) participants = [];

        let title = (
            <View style={styles.participantComponentTitleContainer}>
                <Text style={styles.participantComponentTitle}>
                    活动成员
                </Text>
                <Text style={styles.participantComponentRightTitle}>
                    {`共${participants.length}人`}
                </Text>
            </View>
        );
        return (
            <View style={styles.participantComponentContainer}>
                {title}
                <View style={styles.participantListContainer}>
                    {
                        participants.map((item, i) => {
                            return (
                                <View
                                    key={i.toString()}
                                    style={styles.participantItemContainer}
                                >
                                    <UserAvatar
                                        source={{uri: item.avatar}}
                                        size={30}
                                        id={item.id}
                                    />
                                    <Text
                                        style={styles.participantTitle}
                                        numberOfLines={1}
                                        ellipsizeMode={"tail"}
                                    >{item.nickname}</Text>
                                </View>
                            );
                        })
                    }
                </View>
            </View>
        );
    };
    renderCommentPreview = (comments) => {
        let previewComments = this.getPreviewComments(comments);
        return (
            <View>
                {
                    previewComments.map((comment, i) => {
                    return (
                        <CommentPreview
                            avatar={comment.user.avatar}
                            id={comment.user.id}
                            content={comment.content}
                            nickname={comment.user.nickname}
                            key={i.toString()}
                        />
                        );
                    })
                }
            </View>
        )
    };
    renderComment = (comments) => {
        let commentPreview = this.renderCommentPreview(comments);
        let commentButton =
            <View style={styles.commentButton}>
                <Text
                    style={styles.commentButtonText}
                    onPress={this.toComments}
                >添加评论...</Text>
            </View>;
        let currentUser = this.props.currentUser;
        return (
            <View style={styles.commentContainer}>
                <Text style={styles.commentTitle}>评论</Text>
                {commentPreview}
                <View style={styles.commentButtonContainer}>
                    <UserAvatar
                        title={""}
                        source={{uri: currentUser.avatar,}}
                        size={24}
                        id={currentUser.id}
                    />
                    {commentButton}
                </View>
            </View>
        )
    };
    renderImageViewer = (images) => {

        let imageViewerList = images.map((item, i) => (
            {
                url: item,
                width: WINDOW.width,
                height: WINDOW.height / 3,
                key: i.toString(),
            }
        ));
        return (
            <Modal
                isVisible={this.state.isImageViewerVisible}
                style={{margin: 0}}
                userNativeDriver={true}
            >
                <ImageViewer
                    imageUrls={imageViewerList}
                    onSwipeDown={() => {this.setState({isImageViewerVisible: false})}}
                    enableSwipeDown={true}
                    index={this.state.index}
                />
            </Modal>
        )
    };
    renderFooter = () => {
        let commentIcon =
            <CommentIcon
                color={"#b4b4b4"}
                size={24}
                onPress={this.toComments}
            />;
        let messageIcon = (
            <PaperPlaneIcon
                color={"#b4b4b4"}
                size={24}
                onPress={this.toPrivateChat}
            />
        );
        let editIcon = (
            <EditIcon
                color={"#b4b4b4"}
                size={24}
                onPress={this.modifyAct}
            />
        );
        let messageOrEditButton = this.props.currentAct.isSelf ?
            (
                <TouchableWithoutFeedback
                    onPress={this.toChatPage}
                >
                    <View style={styles.bottomRightIcon}>
                        {editIcon}
                        <Text style={styles.bottomIconText}>编辑</Text>
                    </View>
                </TouchableWithoutFeedback>
            )
            :
            (
            <TouchableWithoutFeedback
                onPress={this.toChatPage}
            >
                <View style={styles.bottomRightIcon}>
                    {messageIcon}
                    <Text style={styles.bottomIconText}>私信</Text>
                </View>
            </TouchableWithoutFeedback>
        );
        let commentButton = (
            <TouchableWithoutFeedback
                onPress={this.toComments}
            >
                <View>
                    {commentIcon}
                    <Text style={styles.bottomIconText}>评论</Text>
                </View>
            </TouchableWithoutFeedback>
        );
        let footerLeftButton = this.renderFooterLeftButton();
        return (
            <View style={styles.footer}>
                <View style={styles.bottomLeftIconContainer}>
                    {footerLeftButton}
                </View>
                <View style={styles.bottomRightIconContainer}>
                    {messageOrEditButton}
                    {commentButton}
                </View>
            </View>
        )
    };
    renderFooterLeftButton = () => {
        let joinIcon =
            <PlusIcon
                color={"#0084ff"}
                size={24}
            />;
        let joinedIcon =
            <CheckIcon
                color={"#afafaf"}
            />;
        let rejectIcon =
            <CloseIcon
                color={"#afafaf"}
            />;
        let joinButton = (
            <Button
                icon={joinIcon}
                title={"加入"}
                titleStyle={styles.bottomButtonText}
                contaienrStyle={styles.bottomButtonContainer}
                buttonStyle={styles.bottomButton}
                loading={this.state.isJoining}
                onPress={this.joinAct}
                TouchableComponent={TouchableWithoutFeedback}
            />
        );
        let joiningButton = (
            <Button
                title={"等待同意"}
                titleStyle={styles.bottomButtonText}
                contaienrStyle={styles.bottomButtonContainer}
                buttonStyle={styles.bottomButton}
                disabled
            />
        );
        let joinedButton = (
            <Button
                icon={joinedIcon}
                title={"已加入"}
                titleStyle={styles.bottomButtonText}
                contaienrStyle={styles.bottomButtonContainer}
                buttonStyle={styles.bottomButton}
                disabled
            />
        );
        let rejectedButton = (
            <Button
                icon={rejectIcon}
                title={"已被拒绝"}
                titleStyle={styles.bottomButtonText}
                contaienrStyle={styles.bottomButtonContainer}
                buttonStyle={styles.bottomButton}
                disabled
            />
        );
        let footerLeftButton;
        switch (this.state.joinStatus) {
            case JOINING:
                footerLeftButton = joiningButton;
                break;
            case NOT_JOIN:
                footerLeftButton = joinButton;
                break;
            case JOINED:
                footerLeftButton = joinedButton;
                break;
            case IS_SPONSOR:
                footerLeftButton = joinedButton;
                break;
            case REJECTED:
                footerLeftButton = rejectedButton;
                break;
            default:
                footerLeftButton = joinButton;
        }
        return footerLeftButton;
    };

    // function for jump between b\pages
    toUserPersonalPage = (id) => {
        NavigationUtil.toPage({id:id}, "PersonalHome")
    };
    goBack = () => {
        this.props.resetActDetail() ;
        NavigationUtil.back(this.props)
    };
    toComments = () => {
        let { comments, sponsor } = this.props.currentAct;
        NavigationUtil.toPage({
            comments: comments,
            sponsor: sponsor.nickname
        }, "ActComment");
    };
    toPublishPage = () => {
        let currentAct = this.props.currentAct;
        switch (currentAct.type) {
            case ACT_TYPE_TAXI:
                NavigationUtil.toPage({type: "taxi"}, "PublishPage");
                break;
            case ACT_TYPE_TAKEOUT:
                NavigationUtil.toPage({type: "takeout"}, "PublishPage");
                break;
            case ACT_TYPE_ORDER:
                NavigationUtil.toPage({type: "order"}, "PublishPage");
                break;
            case ACT_TYPE_OTHER:
                NavigationUtil.toPage({type: "other"}, "PublishPage");
                break;
            default:
                console.log("invalid type");
        }
    };
    toChatPage = () => {
        let {sponsor} = this.props.currentAct;
        NavigationUtil.toPage({receiver: sponsor, type: CHAT_TYPE.PRIVATE_CHAT}, "ChatPage");
    };

    // function for act detail logic
    loadData = (id, jwt, currentUserId, followingList) => {
        this.getUserActStatus(id ,jwt);
        this.props.onLoadActDetail(id, jwt, currentUserId, followingList);
    };
    getUserActStatus = (id, jwt) => {
        Api.getUserActStatus(id, jwt)
            .then(data => {
                this.setState({joinStatus: data.status});
            })
            .catch(err => {
                console.log(err);
            })
    };
    joinAct = () => {
        let {currentUser, currentAct: act} = this.props;
        let jwt = currentUser.jwt;
        this.setState({isJoining: true});
        let user = {
            id: currentUser.id,
            avatar: currentUser.avatar,
            nickname: currentUser.nickname,
            signature: currentUser.signature,
        };
        Api.joinAct(act, jwt)
            .then(() => {
                this.setState({joinStatus: JOINING});
            })
            .catch(err => {
                console.log(err)
            })
            .finally(
                () => {
                    this.setState({isJoining: false});
                }
            )
    };

    // generate preview comments from given comments
    getPreviewComments = (comments) => {
        let previewComments = [];
        let count = 0;
        for (let i = comments.length - 1; i >= 0 && count < 2; i--) {
            if( comments[i].receiverId === -1 ) {
                previewComments.push(comments[i]);
                count++;
            }
        }
        return previewComments
    };

    follow = () => {
        let currentUser = this.props.currentUser;
        let currentAct = this.props.currentAct;
        if (!currentUser.logged) {
            //...
        } else {
            let from = {
                id: currentUser.id,
            };
            let to = {
                id: currentAct.sponsor.id,
                nickname: currentAct.sponsor.nickname,
                avatar_url: currentAct.sponsor.avatar,
                signature: currentAct.sponsor.signature,
            };
            this.props.onFollow(from, to, currentUser.jwt, this);
        }
    };

    unFollow = () => {
        let currentUser = this.props.currentUser;
        if (!currentUser.logged) {
            //...
        } else {
            let from = {
                id: currentUser.id,
            };
            let to = {
                id: this.props.currentAct.sponsor.id,
            };
            this.props.onUnFollow(from, to, currentUser.jwt, this);
        }
    };
    deleteAct = () => {
        let {currentAct, currentUser} = this.props;
        Api.deleteAct(currentAct.id, currentUser.jwt)
            .then(() => {
                NavigationUtil.toPage(null, "Home");
            })
            .catch(err => {
                console.log(err);
            })
    };
    modifyAct = () => {
        let {currentAct, currentUser} = this.props;
        switch (currentAct.type) {
            case ACT_TYPE_ORDER:
                this.props.saveOrderAct(currentAct);
                break;
            case ACT_TYPE_TAKEOUT:
                this.props.saveTakeoutAct(currentAct);
                break;
            case ACT_TYPE_TAXI:
                this.props.saveTaxiAct(currentAct);
                break;
            case ACT_TYPE_OTHER:
                this.props.saveOtherAct(currentAct);
                break;
        }
        this.setState({isTooltipVisible: false});
        NavigationUtil.toPage({action: PUBLISH_ACTION.MODIFY, type: currentAct.type}, "PublishPage");
    };
    toggleEveningMode = ()　=> {
        alert("没有事情发生")
    };
    toTaxiOriginDestDetail = () => {
        let {currentAct} = this.props;
        NavigationUtil.toPage({origin: currentAct.origin, dest: currentAct.dest}, "TaxiOriginDestDetail")
    };
}

const mapStateToProps = state => ({
    currentAct: state.currentAct,
    currentUser: state.currentUser,
    currentUserFollowing: state.currentUserFollowing,
});
const mapDispatchToProps = dispatch => ({
    onLoadActDetail: (actId, jwt, currentUserId, followingList) =>
        dispatch(Activity.onLoadActDetail(actId, jwt, currentUserId, followingList)),
    resetActDetail: () => dispatch(Activity.resetActDetail()),
    onFollow: (from, to, jwt, that) => dispatch(onFollow(from, to, jwt, that)),
    onUnFollow: (from, to, jwt, that) => dispatch(onUnFollow(from, to, jwt, that)),
    saveTaxiAct: data => dispatch(Activity.saveTaxiAct(data)),
    saveTakeoutAct: data => dispatch(Activity.saveTakeoutAct(data)),
    saveOrderAct: data => dispatch(Activity.saveOrderAct(data)),
    saveOtherAct: data => dispatch(Activity.saveOtherAct(data)),
});
export default connect(mapStateToProps ,mapDispatchToProps)(DetailScreen);
const imageWidth = WINDOW.width * 0.4;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width:"100%",
        backgroundColor: "#eeeeee",
    },

    // header style, including title, tags
    headerTitleContainer: {
        flex: 1,
        justifyContent: "center",
    },
    headerTitle: {
        fontWeight: "bold",
        fontSize: 20,
        color: "#3a3a3a",
        textAlign: "center",
    },
    titleContainer:{
        backgroundColor: "#fff",
        paddingLeft:"6%",
        paddingRight:"6%",
        marginBottom: 10,
    },
    title:{
        fontSize: 24,
        fontWeight: "bold",
        color: "#2a2a2a",
    },
    tagContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 12,
        marginTop: 10,
    },
    specContainer: {
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 8,
    },
    specLabel: {
        color: "#0084ff",
    },
    specTitle: {
        color: "#444",
    },
    // body style, including user info, text, images, metadata
    bodyContainer: {
        backgroundColor: "#fff",
        flex: 1,
        width: "100%",
        paddingLeft:"6%",
        paddingRight:"6%",
        marginBottom: 12,
    },
    userInfoContainer: {
        width: "100%",
        padding: 5,
        marginTop: 5,
        marginBottom: 10,
    },
    userInfoTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    userInfoSubtitle: {
        color: "#bbbbbb",
    },
    followBtn: {
        backgroundColor: "#efefef",
        borderRadius: 6,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5
    },
    bodyText: {
        fontSize: 20,
        lineHeight: 26,
        color: "#505050",
    },
    bodyImage: {
        width: imageWidth,
        height: imageWidth,
        resizeMode: "cover",
    },

    // publish time style
    bodyBottomContainer: {
        flexDirection: "row",
        marginTop: 10,
        alignItems: "center",
        marginBottom: 180,
    },
    metadata: {
        color: "#d3d3d3",
        fontSize: 14,
        padding: 8,
    },
    participantComponentContainer: {
        marginBottom: 50,
    },
    participantComponentTitleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    participantComponentTitle: {
        fontWeight: "800",
        fontSize: 18,
        color: "#1a1a1a",
        marginBottom: 20,
        marginTop: 20,
    },
    participantComponentRightTitle: {
        fontSize: 16,
        color: "#bfbfbf",
    },
    participantTitle: {
        fontSize: 12,
        color: "#9f9f9f",
        maxWidth: 40,
    },
    participantListContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    participantItemContainer: {
        marginRight: 20,
        alignItems: "center",
    },
    // comment style, including comment title, comment button, comment preview
    commentContainer: {
        width: "100%",
        marginTop: 5,
        marginBottom: 15,
    },
    commentTitle: {
        fontWeight: "800",
        fontSize: 18,
        color: "#1a1a1a",
        marginBottom: 20,
        marginTop: 20,
    },
    commentButtonContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    commentButton: {
        borderWidth: 1,
        borderColor: "#efefef",
        borderRadius: 30,
        justifyContent: "center",
        flex: 1,
        marginLeft: 15
    },
    commentButtonText: {
        fontSize: 14,
        color: "#dadada",
        flex: 1,
        borderRadius: 30,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 15,
    },

    // footer style
    footer: {
        height: 48,
        width: "100%",
        borderTopWidth: 0.5,
        borderTopColor: "#d3d3d3",
        paddingLeft: "6%",
        paddingRight: "6%",
        flexDirection: "row",
        alignItems: "center",
    },
    bottomLeftIconContainer: {
        flex: 2,
    },
    bottomRightIconContainer: {
        flex: 5,
        justifyContent: "flex-end",
        alignItems: "center",
        flexDirection: "row",
    },
    bottomRightIcon: {
        marginRight: 18,
    },
    bottomButtonContainer: {
        padding: 0,
        backgroundColor: "#b7e2ff",
        borderRadius: 100,
        marginBottom: 15,
    },
    bottomButton: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: 100,
        backgroundColor: "#d3eeff",
    },
    bottomButtonText: {
        color: "#0084ff",
        fontSize: 13,
        fontWeight: "800",
    },
    bottomIconText: {
        fontSize: 12,
        color: "#b7b7b7",
    },
});
