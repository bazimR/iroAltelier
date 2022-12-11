var db = require("../config/connection")
var collections = require("../config/collections")
var bcrypt = require('bcrypt')
const { response } = require("express")
var objectId = require('mongodb').ObjectId
module.exports = {
    addCate: (cateDetes) => {
        let name = cateDetes.name.toUpperCase()
        let offer = praseInt(cateDetes.offer)
        let cateData = {
            name: name,
            offer: offer
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).findOne({ name: name }).then((response) => {
                if (response) {
                    resolve(response)
                }
                else {
                    db.get().collection(collections.CATEGORY_COLLECTION).insertOne(cateData).then((data) => {
                        resolve(data)
                    })
                }
            })
        })
    },
    getCate: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collections.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    deleteCate: (cateId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.CATEGORY_COLLECTION).deleteOne({ _id: objectId(cateId) }).then((response) => [
                resolve(response)
            ])
        })
    },
    detesCate: (cateId) => {
        console.log(cateId);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(cateId) }).then((cate) => {
                resolve(cate)
            })
        })
    },
    editCate: (cateId, cateData) => {
        let num = cateData.offer
        console.log(num);
        let name = cateData.name.toUpperCase()
        let offer = parseInt(num)
        console.log(cateData);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ name: name }).then((response) => {
                if (response.name == name && response.offer != cateData.offer) {
                    db.get().collection(collections.CATEGORY_COLLECTION).updateOne({ _id: objectId(cateId) }, {
                        $set: {
                            offer: offer
                        }
                    }).then((data) => {
                        resolve(data)
                    })
                }
                else if (response.name != name && response.offer != cateData.offer) {
                    db.get().collection(collections.CATEGORY_COLLECTION).updateOne({ _id: objectId(cateId) }, {
                        $set: {
                            name: name,
                            offer: offer
                        }
                    }).then((data) => {
                        resolve(data)
                    })
                }
                else {
                    resolve(response)
                }
            })
        })

    }
}