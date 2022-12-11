const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/product-img')
    },
    filename: function (req, file, cb) {
        // const match = ["image/png", "image/jpeg"];
        var ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        // console.log(file.originalname);
        cb(null, 'productimg' + Date.now() + ext)
    }
})

module.exports=upload = multer({ storage: storage })