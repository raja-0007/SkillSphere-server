const models = require('../Models/Model')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fsPromises = require('fs').promises;
let Vimeo = require('vimeo').Vimeo;

const fs = require('fs');


const searchResults = async (req, res) => {
    // console.log(req.params.search)
    const searchString = req.params.search
    await models.newCourseModel.find({ 'landingPageDetails.title': { $regex: searchString, $options: 'i' } })
        .then(resp => res.send(resp))
}

const enroll = async (req, res) => {

    console.log('enroll', req.body.courseId, req.body.email)
    const user = await models.usersModel.find({ email: req.body.email })
    console.log(user, user[0]._id)
    var enrolled = user[0].enrolled || []
    console.log(enrolled)
    enrolled.push(req.body.courseId)
    await models.usersModel.findByIdAndUpdate(user[0]._id, { enrolled: enrolled }, { new: true })
        .then(resp => { console.log(resp); res.send('success') })
}


const createCourse = async (req, res) => {

    const newCourse = new models.newCourseModel({
        outcomes: JSON.parse(req.body.outcomes),
        requirements: JSON.parse(req.body.requirements),
        intended: JSON.parse(req.body.intended),
        sections: JSON.parse(req.body.sections),
        landingPageDetails: JSON.parse(req.body.landingDetails),
        price: JSON.parse(req.body.price),
        messages: JSON.parse(req.body.messages),
        image: req.file.filename,
        author: JSON.parse(req.body.author).userDetails
    })
    await newCourse.save()
        .then(resp => { console.log('saved', resp), res.send('saved') })

}

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

const getCourseDetails = async (req, res) => {
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
                .then(result => {
                    console.log('new user added', result);
                    const token = jwt.sign({ userId: result._id }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
                    res.send({ status: 'success', token: token, userDetails: result });
                })
                .catch(err => { console.log('error in adding user'); res.send({ status: false, userDetails: {} }); })

        }
    }
}
const controllers = { createCourse, createCourseVideoUpload, home, categorieslist, authorization, getcourses, searchResults, getImage, enroll, getCourseDetails }

module.exports = controllers;