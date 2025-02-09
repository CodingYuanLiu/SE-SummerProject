import axios from "axios"
import qs from "qs"
import Model from "./Model";
import LocalApi from "./LocalApi";


import {OpenFireApi} from "./OpenFireApi";

axios.defaults.baseURL="http://202.120.40.8:30255";
axios.defaults.withCredentials=true;

const Reject = (err, reject) => {
    /* Response is Ok */
    if (err.response) {
        reject(err.response)
    } else if (err.request) {
        /* Request is being dealt with */
    } else {
        /* Respone throw error */
        throw err
    }
};

export default class Api {
    /**
     *
     * @param username
     * @param password
     * @returns {Promise<R>}
     */
    static login(username, password) {
        return new Promise(
            (resolve, reject) => {
                axios.post("/api/public/login/native", qs.stringify({
                        username: username,
                        password: password,
                    }),
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    })
                    .then(res => {

                        /**
                         * jwt: data.jwt_token
                         */
                        resolve(Model.transferToken(res.data))
                    })
                    .catch( err => {
                        Reject(err, reject)
                    })
            }
        )
    }

    /**
     *
     * @param jwt
     * @returns {Promise<R>}
     */
    static getSelfDetail(jwt) {
        return new Promise((resolve, reject) => {
            axios.get("/api/user/status", {
                headers:{
                    "Authorization" : "Bearer " + jwt
                }
            }).then(res => {

                /**
                 * avatar: data.avatar_url,
                 * birthday: data.birthday,
                 * dormitory: data.dormitory,
                 * gender: data.gender,
                 * id: data.id,
                 * jaccount: data.jaccount,
                 * jwt: data.jwt_token,
                 * major: data.major,
                 * nickname: data.nickname,
                 * password: data.password,
                 * phone: data.phone,
                 * signature: data.signature,
                 * username: data.username,
                 */
                resolve(Model.transferUserInfo(res.data))
            }).catch(err => {
                Reject(err, reject)
            })
        })
    }

    /**
     *
     * @param code - oauth2, code
     * @param redirectUri - oauth2, redirect_url
     * @returns {Promise<R>}
     */
    static loginWithJaccount(code, redirectUri) {
        return new Promise((resolve, reject) => {
            axios.post("/api/public/login/jaccount", {
                code: code,
                redirect_uri: redirectUri
            })
                .then(res => {
                    let data = res.data;

                    /**
                     * status: data.status,
                     * jwt: data.jwt_token
                     */
                    resolve({
                        status: data.status,
                        jwt: data.jwt_token,
                    })
                })
                .catch(err => {
                    Reject(err, reject)
                })
        })
    }

    /**
     *
     * @param data - object,
     *  {
     *      username,
     *      password,
     *      nickname,
     *      phone,
     *  }
     * @param jwt
     * @returns {Promise<R>}
     */
    static register = (data, jwt) => {
        return new Promise((resolve, reject) => {
            axios.post("/api/public/register", data, {
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            })
                .then(res => {
                    /**
                     * message
                     */
                    resolve(res.data)
                })
                .catch(err => {
                    if (err.status === 400 ) {
                        reject({
                            exits: true,
                            message: "用户名已存在"
                        })
                    }
                })
        })
    };

    /**
     *
     * @param data - object,
     *  {
     *      id,
     *      phone - optional,
     *      signature - optional,
     *      nickname - optional,
     *      major - optional,
     *      dormitory - optional,
     *      birthday - optional,
     *      gender - optional,
     *  }
     * @param jwt
     * @returns {Promise<R>}
     */
    static updateInfo(data, jwt) {
        return new Promise((resolve, reject) => {
            axios.put("/api/user/info/update", data, {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                }
            })
                .then(res => {

                    /**
                     * message,
                     */
                    resolve(res.data);
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

    /**
     *
     * @param avatar - base64
     * @param jwt
     * @returns {Promise<R>}
     */
    static updateAvatar(avatar, jwt) {
        return new Promise((resolve, reject) => {
            axios.post("/api/user/avatar/upload", avatar, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                }
            })
                .then(res => {

                    /**
                     * avatar
                     */
                    resolve(Model.transferUserAvatar(res.data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

    /**
     *
     * @param id
     * @returns {Promise<R>}
     */
    static getUserInfo(id) {
        return new Promise((resolve, reject) => {
            axios.get(`/api/public/detail?id=${id}`)
                .then(res => {

                    /**
                     * avatar: data.avatar_url,
                     * id: data.id,
                     * birthday: data.birthday,
                     * dormitory: data.dormitory,
                     * gender: data.gender,
                     * major: data.major,
                     * nickname: data.nickname,
                     * phone: data.phone,
                     * signature: data.signature,
                     * privacy: data.privacy
                     */
                    resolve(Model.transferUserInfo(res.data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

    /**
     * @param page - optional
     * @returns {Promise<R>}
     */
    static getAllAct = async (page = null) => {
        try {
            let res = await axios.get("/api/public/act/findall");
            let acts = res.data ? res.data.acts : [];
            acts = Model.transferActivityList(acts);
            let participants;
            for (let act of acts ) {
                try {
                    participants = await this.getActParticipants(act.id);
                    act.participants = participants.length;
                }catch (err) {
                    act.participants = 0;
                }
            }
            return acts;
        }catch (e) {
            console.log(e);
        }

    };
    static getActByType = async(type, jwt = null) => {
        if (type === "all") {
            return this.getAllAct();
        } else {
            let res = await axios.get(`/api/public/act/findbytype?type=${type}`, jwt ? {
                headers: {
                    'Authorization': `Bearer $res.data){jwt}`,
                }
            } : null);
            let acts = res.data ? res.data.acts : [];
            acts = Model.transferActivityList(acts);
            let participants;
            for (let act of acts ) {
                try {
                    participants = await this.getActParticipants(act.id);
                    act.participants = participants.length;
                } catch (err) {
                    act.participants = 0;
                }

            }
            return acts;
        }
    };

    /**
     *
     * @param jwt
     * @param type
     * @param behavior
     * @returns {Promise<R>}
     */
    static recordBehavior(type, behavior, jwt) {
        if (!jwt) return ;
        return new Promise((resolve, reject) => {
            axios.post("/api/user/act/addbehavior", {
                type: type,
                behavior: behavior,
            }, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                },
            })
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                })
        })
    }

    /**
     *
     * @param jwt - recommend need to login
     * @returns {Promise<R>}
     */
    static getRecommendAct = async (jwt) => {
        try {
            let token = jwt;

            let res = await axios.get("/api/user/act/recommendact", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            let acts = res.data ? res.data : [];
            acts = Model.transferActivityList(acts);
            let participants;
            for (let act of acts ) {
                participants = await this.getActParticipants(act.id);
                act.participants = participants.length;
            }
            return acts;
        } catch (e) {
            console.log(e);
        }
    };

    static getActDetail = async (actId, jwt=null) => {
        let res = await axios.get(`/api/public/act/query?act_id=${actId}`);
        let data = Model.transferActivityFromSnakeToCamel(res.data);

        try {
            data.participants = await this.getActParticipants(data.id);
            await LocalApi.saveRecentScan(data);
            await this.recordBehavior(data.type, "scanning", jwt)
        } catch (err) {
            // ...
            data.participants = [];
        }

        return data;

    };
    static getMyJoinAct(jwt) {
        return new Promise((resolve, reject) => {
            axios.get("/api/user/act/myact", {
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            })
                .then(res => {
                    let acts = res.data ? res.data.acts : [];
                    resolve(Model.transferActivityList(acts));
                })
                .catch(err => {
                    Reject(err, reject)
                })
        })
    }
    static getMyManagedAct(jwt) {
        return new Promise((resolve, reject) => {
            axios.get("/api/user/act/manageact", {
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                }
            })
                .then(res => {
                    let acts = res.data ? res.data.acts : [];
                    resolve(Model.transferActivityList(acts));
                })
                .catch(err => {
                    Reject(err, reject)
                })
        })
    }
    static getActByUser(id, jwt) {
        return new Promise((resolve, reject) => {
            axios.get(`/api/public/act/findbyuser?id=${id}`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                }
            })
                .then(res => {
                    let data = res.data;
                    resolve(Model.transferActivityList(data.acts? data.acts : data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

    /**
     *
     * @param jwt
     * @param data
     * @returns {Promise<R>}
     */
    static publishAct =async (data, currentUser) => {
        let res = await axios.post("/api/user/act/publish", data, {
                headers: {
                    "Authorization": `Bearer ${currentUser.jwt}`,
                }
            });
        console.log(res);
        await OpenFireApi.createChatRoom(`act${res.data.act_id}`, data.title, data.description, data.max_member, `user${data.sponsor_id}`);
        try{
            await this.recordBehavior(data.type, "publish", currentUser.jwt);
        } catch (err) {
            // ...
        }
        return {id: res.data.act_id};
    };
    static modifyAct =  (data, jwt) => {
        console.log(data);
        return new Promise((resolve, reject) => {
            axios.post("/api/user/act/modify", data, {
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                }
            })
                .then(res => {
                    console.log(res);
                    resolve(res);
                })
                .catch(err => {
                    console.log(err.response);
                })
        });
    };
    static getTag = async (data, jwt) => {
        let res = await axios.post("/api/user/act/gettag", data, {
            headers: {
                "Authorization": `Bearer ${jwt}`,
            }
        });
        return res.data.tags? res.data : {tags:[]};
    };

    static addTag = async (data, jwt) => {
        console.log(data);
        let res = await axios.post("/api/user/act/addtag", data, {
            headers: {
                "Authorization": `Bearer ${jwt}`,
            }
        });
        return res.data;
    };

    static deleteAct =  (id, jwt) => {
         return new Promise((resolve, reject) => {
             axios.post(`/api/user/act/delete?act_id=${id}`, null, {
                 headers: {
                     'Authorization': `Bearer ${jwt}`,
                 }
             })
                 .then(res => {
                     console.log(res);
                     resolve(res.data);
                 })
                 .catch(err => {
                     console.log(err.response);
                 })
         })
    };
    static addComment = async (comment, currentUser) => {
        let res = await axios.post("/api/user/act/comment",comment, {
            headers: {
                "Authorization": `Bearer ${currentUser.jwt}`
            }
        });
        return res.data;
        // await XmppApi.sendMessage(`user${comment.receiver_id}`, `user${currentUser.id}`, CHAT_TYPE.PRIVATE_CHAT,
        //         "comment", {
        //     // comment message
        //     }
        //     )
    };

    /**
     *
     * activity applicants api
     */
    static joinAct = async (act, jwt) => {
        let res = await axios.post(`/api/user/act/join?act_id=${act.id}`, null, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
            }
        });

        return res.data;
        // await XmppApi.sendMessage(null, null, CHAT_TYPE.PRIVATE_CHAT,
        //     "join", {
        //     // message
        //     }
        //     )
    };

    static quitAct = async (userId, actId, jwt) => {
        try {
            await axios.post(`/api/user/act/quit?act_id=${actId}`, null, {
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                }
            });


        } catch (e) {
            console.log(e.response);
        }
    };

    static deleteFeedback = (id, jwt) => {
        return new Promise((resolve, reject) => {
            axios.post("api/user/feedback/delete", {
                object_id: id,
            }, {
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                }
            })
                .then(res => {
                    resolve(res.data);
                })
                .catch(err => {
                    console.log(err);
                    Reject(err, reject);
                })
        })
    };

    static getActApplicants(jwt) {
        return new Promise((resolve, reject) => {
            axios.get("/api/user/act/getjoinapp", {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            })
                .then(res => {

                    /**
                     * act: {
                     *     id: data.act_id,
                     *     title: data.act_title,
                     *     type: data.type,
                     * },
                     * applicant: {
                     *     id: data.applicant_id,
                     *     nickname: data.applicant_nickname,
                     *     avatar: data.applicant_avatar,
                     * }
                     *
                     */
                    let data = res.data;
                    resolve(Model.transferApplicantList(data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }
    static getActParticipants(id) {
        return new Promise((resolve, reject) => {
            axios.get(`/api/public/act/getactivitymember?act_id=${id}`)
                .then(res => {

                    /**
                     * id: data.user_id,
                     * nickname: data.user_nickname,
                     * signature: data.user_signature,
                     * avatar: data.user_avatar,
                     */
                    let data = res.data;
                    resolve(Model.transferParticipantList(data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

    static getUserActStatus = (actId, jwt) => {
        return new Promise((resolve, reject) => {
            axios.get(`/api/user/act/status?act_id=${actId}`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                }
            })
                .then(res => {
                    resolve(res.data);
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    };
    static acceptApplicant = async (actId, user, jwt) => {
        let res = await axios.post(`/api/user/act/acceptjoin?act_id=${actId}&user_id=${user.id}`,
                null, {
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });
    };
    static rejectApplicant(actId, userId, jwt) {
        console.log(actId, userId, jwt);
        return new Promise((resolve, reject) => {
            axios.post(`/api/user/act/refuse?act_id=${actId}&user_id=${userId}`, null, {
                "Authorization": `Bearer ${jwt}`,
            })
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    console.log(err);
                    Reject(err, reject);
                })
        })
    }
    static searchTakeoutStore (keyword) {
        return new Promise((resolve, reject) => {
            axios.get(`/api/public/takeout/searchshop?key=${keyword}`)
                .then(res => {

                    /**
                     * id,
                     * name
                     */
                    resolve(res.data);
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }
    static searchAct(text) {
        return new Promise((resolve, reject) => {
            axios.get(`/api/public/act/search?key=${text}`)
                .then(res => {

                    let acts = res.data ? res.data.acts : [];
                    resolve(Model.transferActivityList(acts));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

    /**
     *
     * @param data - object
     *  {
     *
     *  }
     * @param jwt
     * @returns {Promise<R>}
     */
    static publishFeedback = (data, jwt) => {
        return new Promise((resolve, reject) => {
            axios.post("api/user/feedback/publish", data, {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                }
            })
                .then(res => {

                    /**
                     * feedbackId: data.feedback_id
                     */
                    let data = res.data;
                    resolve({id: data.feedback_id});
                })
                .catch(err => {
                    Reject(err, reject)
                })
        })
    };

    /**
     *
     * @param id - user id
     * @returns {Promise<R>}
     */
    static getFeedback = (id) => {
        return new Promise((resolve, reject) => {
            axios.get(`api/public/feedback/query?receiver_id=${id}`)
                .then(res => {

                    /**
                     *  act: {
                     *      id: data.act_id,
                     *      title: data.act_title,
                     *  },
                     *  feedbackId: data.feedback_id,
                     *  communication: {
                     *      data: data.communication,
                     *      desc: data.communication_desc,
                     *  },
                     *  honesty: {
                     *      data: data.honesty,
                     *      desc: data.honesty_desc,
                     *  },
                     *  punctuality: {
                     *      data: data.punctuality,
                     *      desc: data.punctuality_desc,
                     *  },
                     *  images: data.fb_images,
                     *  comments: data.fb_comments ? data.fb_comments : [],
                     *  createTime: data.time,
                     *  user: {
                     *      id: data.user_id,
                     *      avatar: data.user_avatar,
                     *      nickname: data.user_nickname,
                     *  }
                     *
                     */
                    let data = res.data;
                    resolve(Model.transferFeedbackList(data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        });
    };

    /**
     *
     * @param id - feedback id
     * @param jwt
     * @returns {Promise<R>}
     */
    static deleteFeedback = (id, jwt) => {
        return new Promise((resolve, reject) => {
             axios.post('api/user/feedback/delete', {
                 object_id: id,
             }, {
                 headers: {
                     'Authorization': `Bearer ${jwt}`
                 }
             })
                 .then(res => {
                     resolve(res.data);
                 })
                 .catch(err => {
                     Reject(err, reject);
                 })
        });
    };

    static commentFeedback = async (data, currentUser) => {
        let res = await axios.post("api/user/feedback/comment", data, {
            headers: {
                "Authorization": `Bearer ${currentUser.jwt}`,
            }
        });

        return res.data;
    };

    /**
     *
     * @param from
     * @param to
     * @param jwt
     * @returns {Promise<R>}
     */

    static follow = async (from, to, jwt) => {
        let res = await axios.get(`/api/user/follow?id=${to}`, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
        });
        return res.data;
        // await XmppApi.sendMessage(`user${from}`, `user${to}`, CHAT_TYPE.PRIVATE_CHAT,
        //     "follow", {
        //         // message
        //     }
        // )
    };
    static unFollow = async (from, to, jwt) => {
        let res = await axios.get(`/api/user/unfollow?id=${to}`, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
        });

    };
    static getFollowings(jwt) {
        return new Promise((resolve, reject) => {
            axios.get("/api/user/followings", {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                },
            })
                .then(res => {

                    /**
                     * id: data.id,
                     * nickname: data.nickname,
                     * avatar: data.avatar_url,
                     * signature: data.signature,
                     */
                    let data = res.data;
                    resolve(Model.transferFollowingList(data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }
    static getFollowers(jwt) {
        return new Promise((resolve, reject) => {
            axios.get("/api/user/followers", {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                },
            })
                .then(res => {

                    /**
                     * id: data.id,
                     * nickname: data.nickname,
                     * avatar: data.avatar_url,
                     * signature: data.signature,
                     */
                    let data = res.data;
                    resolve(Model.transferFollowerList(data));
                })
                .catch(err => {
                    Reject(err, reject);
                })
        })
    }

}
