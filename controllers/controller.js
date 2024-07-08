const models = require('../Models/Model')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fsPromises = require('fs').promises;
let Vimeo = require('vimeo').Vimeo;
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51PJUGRSCSlPFnl40eXYhsPqHvL5qCLxiL0jkBGoAaXxrdn0OAekkhH4S5xmh7qcXvJDEZScBx20HZFmz9NXYzqRo00YL3tZaXR');

const fs = require('fs');


const searchResults = async (req, res) => {
    // console.log(req.params.search)
    const searchString = req.params.search
    await models.newCourseModel.find({ 'landingPageDetails.title': { $regex: searchString, $options: 'i' } })
        .then(resp => res.send(resp))
}


//enrollment functions
const enroll = async (req, res) => {
    // console.log('enrolledddddd', JSON.parse(req.body.courseIds), 'userid:::', req.body.userId)
    const usersData = await models.userDataModel.find({ userId: req.body.userId })
    var cart = usersData[0].cart || []
    // console.log(cart)
    cart = cart.filter(item => !JSON.parse(req.body.courseIds).includes(item._id))

    await models.userDataModel.findByIdAndUpdate(usersData[0]._id, { cart: cart }, { new: true })
        .then(resp => { console.log(resp); })


    await models.newCourseModel.updateMany(
        { _id: { $in: JSON.parse(req.body.courseIds) } },
        { $push: { enrolled: req.body.userId } }
    )
        .then(resp => { console.log('enrolled'); res.send({ status: 'success', enrolled: resp.enrolled }) })


}

const getEnrolled = async (req, res) => {
    // console.log(req.params.userId)
    // console.log('enrolledddd')
    const enrolled = await models.newCourseModel.find({ enrolled: { $in: [req.params.userId] } })
    // console.log(user, user[0]?._id)

    res.send({ status: 'success', enrolled: enrolled })
}


//cart functions
const addToCart = async (req, res) => {
    // console.log(req.body.course, req.body.userId)
    const usersData = await models.userDataModel.find({ userId: req.body.userId })

    if (usersData.length == 0) {
        let userData = new models.userDataModel({
            userId: req.body.userId,
            cart: [JSON.parse(req.body.course)]
        })

        await userData.save()
            .then(resp => { console.log('added to cart successfully'); res.send({ status: 'success', cart: userData.cart }) })
    }
    else {

        // console.log(usersData, usersData[0]._id)
        var cart = usersData[0].cart || []
        // console.log(cart)
        cart.push(JSON.parse(req.body.course))

        await models.userDataModel.findByIdAndUpdate(usersData[0]._id, { cart: cart }, { new: true })
            .then(resp => { console.log('added to cart successfully'); res.send({ status: 'success', cart: resp.cart }) })
    }
}

const removeFromCart = async (req, res) => {
    // console.log(req.body.courseId, req.body.userId)
    const usersData = await models.userDataModel.find({ userId: req.body.userId })
    var cart = usersData[0].cart || []
    // console.log(cart)

    cart = cart.filter(item => item._id !== req.body.courseId)

    await models.userDataModel.findByIdAndUpdate(usersData[0]._id, { cart: cart }, { new: true })
        .then(resp => { console.log('removed from cart'); res.send({ status: 'success', cart: resp.cart }) })
}

const getCart = async (req, res) => {
    // console.log(req.params.userId)
    const user = await models.userDataModel.find({ userId: req.params.userId })
    // console.log(user, user[0]?._id)
    const cart = user[0]?.cart || []
    res.send({ status: 'success', cart: cart })
}


//wishlist routes
const addToWishlist = async (req, res) => {
    // console.log(req.body.courseId, req.body.userId)
    const usersData = await models.userDataModel.find({ userId: req.body.userId })

    if (usersData.length == 0) {
        let userData = new models.userDataModel({
            userId: req.body.userId,
            wishList: [req.body.courseId]
        })

        await userData.save()
            .then(resp => { 
                // console.log(resp);
                 res.send({ status: 'success', wishList: userData.wishList })
                 })
    }
    else {

        // console.log(usersData, usersData[0]._id)
        var wishList = usersData[0].wishList || []
        // console.log(wishList)
        wishList.push(req.body.courseId)

        await models.userDataModel.findByIdAndUpdate(usersData[0]._id, { wishList: wishList }, { new: true })
            .then(resp => { console.log(resp); res.send({ status: 'success', wishList: resp.wishList }) })
    }
}

const getWishlist = async (req, res) => {
    // console.log(req.params.userId)
    const user = await models.userDataModel.find({ userId: req.params.userId })
    // console.log(user, user[0]?._id)
    const wishList = user[0]?.wishList || []
    const List = await models.newCourseModel.find({ _id: { $in: wishList } })

    res.send({ status: 'success', wishList: List, RawList: wishList })
}

const removeFromWishlist = async (req, res) => {
    const { courseId, userId } = req.params
    const usersData = await models.userDataModel.find({ userId: userId })
    var wishList = usersData[0].wishList || []
    // console.log(wishList)

    wishList = wishList.filter(item => item !== courseId)

    await models.userDataModel.findByIdAndUpdate(usersData[0]._id, { wishList: wishList }, { new: true })
        .then(resp => { console.log('deleted from wishlist'); res.send({ status: 'success', wishList: resp.wishList }) })
}


//course completion routes
const updateCompletion = async (req, res) => {
    const { courseId, userId, lectId } = req.params
    console.log(userId)
    const userData = await models.userDataModel.find({ userId: userId })
    let completedLectures = userData[0]?.completedLectures || []

    if (completedLectures.filter(item => item.courseId == courseId).length > 0) {

        completedLectures = completedLectures.map(item => item.courseId == courseId ? { ...item, completedLectures: [...item?.completedLectures, lectId] } : item)
    }
    else {
        completedLectures.push({
            courseId: courseId,
            completedLectures: [lectId]
        })
    }

    console.log('updated list', completedLectures)

    try {

        await models.userDataModel.findOneAndUpdate({ userId: userId }, { completedLectures: completedLectures }, { new: true })
            .then(resp => { console.log('updated completion ', resp); })

        res.status(200).send({ status: 'success', completedLectures: completedLectures.filter(item => item.courseId == courseId)[0].completedLectures })
    }
    catch (err) {
        res.status(500).send({ status: 'failed' })
    }



}

const getCompletionDetails = async (req, res) => {
    const { courseId, userId } = req.params
    const userData = await models.userDataModel.find({ userId: userId })
    let completedLectures = userData[0]?.completedLectures || []
    res.send({ status: 'success', completedLectures: completedLectures.filter(item => item.courseId == courseId)[0]?.completedLectures || []})
}


//rating routes
const updateOverallRating=async(courseId)=>{
    console.log('courseId, overallupdate', courseId)
    const usersData = await models.userDataModel.find()
    // const avarageUsers = usersData.length
    const ratings = usersData.flatMap(data=>data.ratings)
    const totalUsers = ratings.filter(item=>item.courseId == courseId)
    console.log('ratings',ratings,'totalusers', totalUsers)
    var totalRatings = 0
    totalUsers.forEach(user => {
        totalRatings += user.rating
    });
    console.log(totalRatings)
    let averageRating = parseFloat(totalRatings/totalUsers.length).toFixed(1)
    console.log(averageRating)
    await models.newCourseModel.findByIdAndUpdate(courseId, {rating: {rating:averageRating.toString(), TotalRatings: totalUsers.length}}, {new: true})
    .then((resp)=>console.log('overall rating updated for this course', resp._id))
}
const addRating = async (req, res) => {
    const { courseId, userId, rating } = req.body
    const userData = await models.userDataModel.find({ userId: userId })
    let ratings = userData[0]?.ratings || []
    ratings.push({
        courseId: courseId,
        rating: rating
    })
    try{

        await models.userDataModel.findOneAndUpdate({userId:userId},{ratings: ratings})
        .then(()=>{
            updateOverallRating(courseId)
            res.send({status:'success', ratings: ratings})
        })
    }
    catch(err){
        console.log(err)
        res.send({status:'failed'})
    }
    

}
const editRating = async (req, res) => {
    const { courseId, userId, rating } = req.body
    const userData = await models.userDataModel.find({ userId: userId })
    let ratings = userData[0]?.ratings || []
    ratings = ratings.map(item => item.courseId == courseId ? { ...item, rating: rating } : item)
    
    try{

        await models.userDataModel.findOneAndUpdate({userId:userId},{ratings: ratings})
        .then(()=>{
            updateOverallRating(courseId)
            res.send({status:'success', ratings: ratings})
        })    }
    catch(err){
        console.log(err)
        res.send({status:'failed'})
    }
    

}
const getRatings = async (req, res) => {
    const { courseIds, userId } = req.params
    const userData = await models.userDataModel.find({userId: userId})
    let ratings = userData[0]?.ratings || []
    ratings = ratings.filter(item => courseIds.includes(item.courseId))
    res.send({status:'success', ratings: ratings})
}





const addPayment = async (req, res) => {
    const { cart, userId } = req.body
    var str = ''
    JSON.parse(cart).forEach(item => {
        str += `${item._id}/`
    });
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: JSON.parse(cart).map(item => ({

            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.landingPageDetails.title
                },
                unit_amount: parseInt(item.price) * 100
            },

            quantity: 1,

        })),
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/success/${str}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`
    })


    console.log(`${process.env.FRONTEND_URL}/success/${str}`)


    res.send({ id: session.id })
}




//teacher route
const GetTeacherCourses = async (req, res) => {
    const { userId } = req.params
    console.log(userId)
    await models.newCourseModel.find({ 'author.authorId': userId })
        .then(resp => { console.log(resp); res.send({ status: 'success', courses: resp }) })
}


//teacher route
const createCourse = async (req, res) => {
    const author = JSON.parse(req.body.author).userDetails

    const newCourse = new models.newCourseModel({
        outcomes: JSON.parse(req.body.outcomes),
        requirements: JSON.parse(req.body.requirements),
        intended: JSON.parse(req.body.intended),
        sections: JSON.parse(req.body.sections),
        landingPageDetails: JSON.parse(req.body.landingDetails),
        price: JSON.parse(req.body.price),
        messages: JSON.parse(req.body.messages),
        image: req.file.filename,
        author: { authorId: author._id, username: author.username, email: author.email }
    })
    await newCourse.save()
        .then(resp => { console.log('saved', resp), res.send({ status: 'saved', courseId: resp._id , authorId: resp.author.authorId}) })

}
//teacher route
const createCourseVideoUpload = async (req, res) => {
    let client = new Vimeo(process.env.VIMEO_CLIENT_ID, process.env.VIMEO_SECRET, process.env.VIMEO_TOKEN);
    let file_name = `videos/${req.file.filename}`

    const getVideoUrl = (uri) => {
        client.request(uri + '?fields=link', function (error, body, statusCode, headers) {
            if (error) {
                console.log('There was an error making the request.')
                console.log('Server reported: ' + error)
                res.send({ status: 'failed', message: 'error in getting video url' })
                return
            }

            console.log('Your video link is: ' + body.link)
            res.send({ status: 'success', videoUrl: body.link })
        })
    }
    const getTranscoding = (uri) => {
        client.request(uri + '?fields=transcode.status', function (error, body, status_code, headers) {
            if (body.transcode.status === 'complete') {
                console.log('Your video finished transcoding.')
            } else if (body.transcode.status === 'in_progress') {
                console.log('Your video is still transcoding.')
            } else {
                console.log('Your video encountered an error during transcoding.')
                res.send({ status: 'failed', message: 'error in transcoding video ' })
            }
        })
    }
    client.upload(
        file_name,
        {
            'name': 'Untitled',
            'description': 'The description goes here.'
        },
        function (uri) {
            console.log('Your video URI is: ' + uri);
            getTranscoding(uri)
            getVideoUrl(uri)
        },
        function (bytes_uploaded, bytes_total) {
            var percentage = (bytes_uploaded / bytes_total * 100).toFixed(2)
            console.log(bytes_uploaded, bytes_total, percentage + '%')
        },
        function (error) {
            console.log('Failed because: ' + error)
            res.send({ status: 'failed', message: 'error in uploading video ' })
        }
    )


}

const getCourseDetails = async (req, res) => {  //currently not using

    const courseId = req.params.courseId
    await models.newCourseModel.findById(courseId)
        .then(resp => res.send(resp))
}

const imagesDirectory = path.join(__dirname, '../images'); //currently not using
const getImage = async (req, res) => { // currently not using
    const filename = req.params.img;
    const filePath = path.join(imagesDirectory, filename);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, send 404 error
            res.status(404).send('Image not found');
        } else {
            // File exists, send it as response
            console.log('sending', filePath)
            res.sendFile('http://localhost:7777/images/image-1715318557651.jpg');
        }
    });
}

const home = async (req, res) => {
    const courses = await models.courseModel.find()
    res.send(courses)
}

const getcourses = async (req, res) => {
    // console.log(req.query.course, 'igli')
    const courses = await models.courseModel.find({ topic: req.query.course.toLowerCase() })
    console.log(courses)
    res.send(courses)
}

const categorieslist = async (req, res) => {
    const list = await models.categoriesModel.find()
    //console.log(list[0].categories)
    res.send(list[0].categories)
}

const getUserDetails = async (req, res) => {      //currently not using
    console.log(req.params.userId)
    const user = await models.usersModel.find({ _id: req.params.userId })
    console.log(user, user[0]._id)
    res.send({ status: 'success', data: user })

}
const authorization = async (req, res) => {

    console.log(req.body.action)
    if (req.body.action === 'login') {
        console.log(req.body.email)
        const user_status = await models.usersModel.find({ email: req.body.email })
        //console.log(user_status)
        if (user_status.length > 0) {
            const user = user_status[0]
            if (user && await bcrypt.compare(req.body.password, user.password)) {
                // currentUser = {
                //     name: user.name,
                //     email: user.email
                // }
                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });

                res.send({
                    status: 'authorised', token: token, userDetails: user
                })

            }
            else {

                res.send({ status: 'unauthorised' })
            }
        }
        else {
            res.send(false)
        }

    }
    else if (req.body.action === 'register') {
        const user_status = await models.usersModel.find({ email: req.body.email })
        //console.log(user_status)
        if (user_status.length > 0) {
            // res.send('already exists')
            const user = user_status[0]
            res.send({ status: 'already exists' })
        }
        else {
            // let currentUser = {
            //     name: req.body.username,
            //     email: req.body.email,
            // }
            const hashedPassword = await bcrypt.hash(req.body.password, 10)

            const user = new models.usersModel({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            })


            // const token = jwt.sign(user, process.env.JWT_SECRET_KEY,{expiresIn:'24h'})
            await user.save()
                .then(async (result) => {
                    console.log('new user added', result);
                    const newUserData = new models.userDataModel({
                        userId: result._id,
                        completedLectures: [],
                        cart: [],
                        wishList: []
                    })
                    await newUserData.save()
                    const token = jwt.sign({ userId: result._id }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
                    res.send({ status: 'success', token: token, userDetails: result });
                })
                .catch(err => { console.log('error in adding user'); res.send({ status: false, userDetails: {} }); })

        }
    }
}
const controllers = {
    createCourse, createCourseVideoUpload, home,
    categorieslist, authorization, getUserDetails,
    getcourses, searchResults, getImage, addToCart,
    addPayment, getCart, getEnrolled, enroll, getCourseDetails,
    removeFromCart, GetTeacherCourses, addToWishlist, getWishlist,
     removeFromWishlist, updateCompletion, getCompletionDetails, addRating, editRating, getRatings
}

module.exports = controllers;