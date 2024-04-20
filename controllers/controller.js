const models = require('../Models/Model')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const createCourse = async (req, res) => {
    const course = req.body

    const newcourse = await new courseModel({
        ...course,
    })

    await newcourse.save()
        .then(console.log('saved'))
        .catch(err => console.log('error in saving', err))
}

const home = async (req, res) => {

    

    // Run the Python script
    // pyt.runString('x=1+1;print(x)', null).then(messages => {
    //     console.log('finished:', messages);
    // });
    
    
    const courses = await models.courseModel.find()
    //console.log(courses)
    res.send(courses)
}

const getcourses = async (req, res) => {
    console.log(req.query.course, 'igli')
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

                res.send({ status: 'authorised', token:token,userDetails: {
                    username: user.username,
                    email: user.email
                } })

            }
            else {
                
                res.send({ status: 'unauthorised'})
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
            res.send({ status: 'already exists'})
        }
        else {
            // let currentUser = {
            //     name: req.body.username,
            //     email: req.body.email,
            // }
            const hashedPassword = await bcrypt.hash(req.body.password,10)
            
            const user = new models.usersModel({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            })
            // const token = jwt.sign(user, process.env.JWT_SECRET_KEY,{expiresIn:'24h'})
            await user.save()
                .then(result => { console.log('new user added', result);
                const token = jwt.sign({ userId: result._id }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
                res.send({ status: 'success', token: token, userDetails:result });
                })
                .catch(err => { console.log('error in adding user'); res.send({ status: false, userDetails: {} }); })

        }
    }
}
const controllers = { createCourse, home, categorieslist, authorization, getcourses }

module.exports = controllers;
