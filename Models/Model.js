
const mongoose = require('mongoose')

const courseSchema = mongoose.Schema({
    
    topic: String,
    description: String,
    category: String,
    title: String,
    image: String,
    author: String,
    rating: String,
    cost: String

})

const newCourseSchema= mongoose.Schema({
    outcomes:Array,
    requirements:Array,
    intended:Array,
    sections:Array,
    landingPageDetails:Object,
    price:String,
    messages:Object,
    author:Object,
    image:String
})

const categoriesSchema = mongoose.Schema({
    categories:Array
})
const usersSchema = mongoose.Schema({
    username:String,
    email:String,
    password:String,
    
})
const newCourseModel = new mongoose.model('newCourses', newCourseSchema)
const categoriesModel = new mongoose.model('categories',categoriesSchema)
const courseModel = new mongoose.model('courses', courseSchema)
const usersModel = new mongoose.model('users',usersSchema)


const models = {courseModel, categoriesModel, usersModel, newCourseModel}
module.exports = models