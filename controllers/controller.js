const models = require('../Models/Model')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fsPromises = require('fs').promises;

const fs = require('fs');


const searchResults = async(req, res)=>{
    // console.log(req.params.search)
    const searchString = req.params.search
    await models.newCourseModel.find({'landingPageDetails.title': { $regex: searchString, $options: 'i' }})
    .then(resp=>res.send(resp))
}


const createCourse = async (req, res) => {
    // console.log('body>>>>>>>>', req.body)
    // console.log(JSON.parse(req.body.sections)[0], req.file.filename)
    // Object.keys(req.body).forEach(element => {
    //     console.log(element, '>>>>>>>>>>. ', JSON.parse(req.body[element]))
    // });
    const newCourse = new models.newCourseModel({
        outcomes: JSON.parse(req.body.outcomes),
        requirements: JSON.parse(req.body.requirements),
        intended: JSON.parse(req.body.intended),
        sections: JSON.parse(req.body.sections),
        landingPageDetails: JSON.parse(req.body.landingDetails),
        price: JSON.parse(req.body.price),
        messages: JSON.parse(req.body.messages),
        image: req.file.filename,
        author:JSON.parse(req.body.author).userDetails
    })
    await newCourse.save()
    .then(resp=>{console.log('saved', resp),res.send('saved')})
    
}

// const getImage = async(req,res)=>{
//     console.log(req.params.img)
//     if(req.params.img) res.send(require(`../images/${req.params.img}`))
//     else res.sendFile(require(`../images/image-1715318536066.jpg`))
// }
const imagesDirectory = path.join(__dirname, '../images');

const getImage = async(req, res) => {
    const filename = req.params.img;
    const filePath = path.join(imagesDirectory, filename);
    // console.log(filePath)
    // Check if the file exists and send it, otherwise send a 404 response
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
                    status: 'authorised', token: token, userDetails: {
                        username: user.username,
                        email: user.email
                    }
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
const controllers = { createCourse, home, categorieslist, authorization, getcourses, searchResults, getImage }

module.exports = controllers;
