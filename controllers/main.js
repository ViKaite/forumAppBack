const forumUserModel= require("../models/forumUserShema")
const themaModel= require("../models/themaSchema")
const notificationModel= require("../models/notificationSchema")
const bcrypt = require("bcrypt")    // HASH crypto modulis


module.exports = {
    registeruser: async (req, res) => {
        const data = req.body

        const createCrypto = async(data) =>{
            const hash = await bcrypt.hash(data.password,10)

            const isUser = await  forumUserModel.findOne({username:data.name})

            if (!isUser){
                const user = new forumUserModel()
                user.username = data.name
                user.createTime = Date.now()
                user.password = hash
                user.photo = data.photo

                const newUser = await user.save()

                res.send({success:true, message: " User has been registered"})

            }else{

                res.send({success:false, message: " This username allready exists"})
            }
        }
        createCrypto(data)
    },
    loginuser: async (req, res) => {
        const data = req.body


        const comparePsw = async(data) =>{

            const user = await  forumUserModel.findOne({username:data.name})

            if (user){
                const compare = await bcrypt.compare(data.password,user.password)

                if(!compare){

                    req.session.user = null
                    res.send({success: false, message: "Something wrong with this password"})
                }else{

                    req.session.user = user
                    res.send({success: true, message: "User logged successfully", user})
                }

            }else{

                req.session.user = null
                res.send({success: false, message: "There are no such user"})
            }
        }
        comparePsw(data)
    },
    logout: (req, res) => {
        req.session.user = null
        res.send({success: true, message: "User logged out"})
    },
    allusers: async (req, res) => {
        const user = req.session.user

        const allUsers = await forumUserModel.find()

        if(req.session.user){
            res.send({message:"All users", allUsers, user})
        }else{
            res.send({message:"All users without active user", allUsers})
        }
    },
    changeavatar: async (req, res) => {
        const user = req.session.user
        const data = req.body

        if(req.session.user){
            await forumUserModel.findOneAndUpdate({_id:user._id},{photo:data.photo})
            res.send({success: true, message: "Avatar changed successfully"})
        } else{
            res.send({success: false, message: "You can not change avatar for nobody"})
        }

    },
    createtopic: async (req, res) => {
        const data = req.body
        const user = req.session.user


        if(req.session.user){

            const thema = new themaModel()
            thema.username=req.session.user.username
            thema.title = data.title
            thema.time = Date.now()

            const newtopic = await thema.save()
            return res.send({success:true, message:"Topic has been created successfully ", newtopic })
        }
        res.send({success:false, message:"To create new topic you need login first"})
    },

    alltopics: async (req, res) => {
        const user = req.session.user
        //console.log("current user", req.session.user)
        let allTopics = await themaModel.find()
        const allUsers = await forumUserModel.find()

        allTopics = allTopics.map(x =>( {
            _id: x._id,
            username: x.username,
            title: x.title,
            time: x.time,
            posts: x.posts,
            photo: allUsers.find(y=> y.username===x.username).photo}))
        allTopics.reverse()

        if(req.session.user){
            res.send({message:"All topics", allTopics, user})
        }else{
            res.send({message:"All topics without active user", allTopics})
        }
    },
    gettopic: async (req,res) =>{
        const {id} = req.params
        const user = req.session.user


        const singletopic = await themaModel.findOne({_id:id})

        if(req.session.user){
            res.send({message: "Single topic", singletopic, user})
        }else{
            res.send({message:"Single topic without active user", singletopic})
        }

    },
    createpost: async (req,res) =>{
        const {id} = req.params
        const user = req.session.user
        const data = req.body

        if(user){
            const newpost ={
                "username": user.username,
                "photo": data.photo,
                "youtubeUrl": data.youtubeUrl,
                "text": data.text,
                "time": Date.now()
            }
            await themaModel.findOneAndUpdate({_id:id}, {$push:{posts:newpost}})
            const oneTopic = await themaModel.findOne({_id:id})
            const notification = new notificationModel()
            notification.username= oneTopic.username,
                notification.title= oneTopic.title,
                notification.readStatus= false

            const newNotification = await notification.save()

            res.send({success:true, message: "Post has been created successfully", oneTopic})

        } else {
            res.send({success:false, message:"To create new topic you need login first" })
        }
    },
    getFavoriteTopics: async (req, res) => {
        const {favoriteArray} = req.body;
        let topics = await themaModel.find({_id: favoriteArray});
        const allUsers = await forumUserModel.find()
        topics = topics.map(x =>( {
            _id: x._id,
            username: x.username,
            title: x.title,
            time: x.time,
            posts: x.posts,
            photo: allUsers.find(y=> y.username===x.username).photo}))

        res.send({success: true, getFavoriteTopics: topics});
    },

    myposts: async (req,res) =>{

        const user = req.session.user

        let myPosts = await themaModel.find({'posts.username':user.username})

        myPosts = myPosts.map(x =>( {
            _id: x._id,
            username: x.username,
            title: x.title,
            time: x.time,
            posts: x.posts.filter(y=>y.username===user.username),
        }))

        res.send({success: true, message: "myposts", myPosts})
    },

    getnotifications: async (req, res) =>{
        const user = req.session.user
        if(user){
            const activeNotifications = await notificationModel.find({"username": user.username, "readStatus": false})
            res.send({success: true, message: "get notifications", activeNotifications})
        } else {
            res.send({success: false, message: "you are not logged in - no notifications"})
        }
    },
    clearnotifications: async (req, res) =>{
        const user = req.session.user
        if(user){

            const activeNotifications = await notificationModel.updateMany({username: user.username},{readStatus:true})
            res.send({success: true, message: "clear notifications", activeNotifications})
        } else {
            res.send({success: false, message: "you are not logged in - no any notifications"})
        }
    },

}