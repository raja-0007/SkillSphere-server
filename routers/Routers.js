
const controllers = require('../controllers/controller')
const express = require('express')
const authenticationJWT = require('../middlewares/authenticationJWT')
const multer = require('multer')

const storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null,'images')
    },
    filename:(req, file, cb)=>{
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage:storage})
const router = express.Router()

router.get('/',controllers.home)
router.get('/getcourse',controllers.getcourses)
router.post('/authorization',authenticationJWT,controllers.authorization)
router.get('/categorieslist',controllers.categorieslist)
router.post('/createcourse', upload.single('image'), controllers.createCourse)
router.get('/searchResults/:search',controllers.searchResults)
router.get('/getImage/:img',controllers.getImage)

// const path = require('path');
// const app = express();

// const imagesDirectory = path.join(__dirname, '../images');

// app.use('/getImage/:img', express.static(imagesDirectory));

module.exports = router;