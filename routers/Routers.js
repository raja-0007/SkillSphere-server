
const controllers = require('../controllers/controller')
const express = require('express')
const authenticationJWT = require('../middlewares/authenticationJWT')
const multer = require('multer') //for image uploads
const path = require('path');

const storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null,'images')
    },
    filename:(req, file, cb)=>{
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
// storage2 is for video uploads
const storage2 = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null,'videos')
    },
    filename:(req, file, cb)=>{
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage:storage}) // for image uploads
const upload2 = multer({storage:storage2}) // for video uploads
const router = express.Router()

router.get('/',controllers.home)
router.get('/getcourse',controllers.getcourses)
router.post('/authorization',authenticationJWT,controllers.authorization)
router.get('/categorieslist',controllers.categorieslist)
router.post('/createcourse', upload.single('image'), controllers.createCourse)
router.post('/createcourse/videoUpload', upload2.single('video'), controllers.createCourseVideoUpload)
router.get('/searchResults/:search',controllers.searchResults)
router.get('/getImage/:img',controllers.getImage)
router.post('/addToCart', controllers.addToCart)
router.get('/getCart/:userId', controllers.getCart)
router.post('/create-checkout-session',controllers.addPayment)
router.get('/getUserDetails/:userId', controllers.getUserDetails) //currently not using
router.post('/enroll',controllers.enroll)
router.get('/getEnrolled/:userId', controllers.getEnrolled)
router.get('/getCourseDetails/:courseId',controllers.getCourseDetails)

// const path = require('path');
// const app = express();

// const imagesDirectory = path.join(__dirname, '../images');

// app.use('/getImage/:img', express.static(imagesDirectory));

module.exports = router;