var db = require("../config/connection")
var collections = require("../config/collections")
var bcrypt = require('bcrypt')
const { response } = require("express")
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (proData) => {
        return new Promise(async (resolve, reject) => {
            let proObj = {
                name: proData.name,
                category: proData.category,
                description: proData.description,
                quantity: parseInt(proData.quantity),
                price: proData.price,
                offerprice: proData.offerprice,
                imageFilename: proData.imageFilename,
                isAvailable: true
            }
            db.get().collection(collections.PRODUCTS_COLLECTION).insertOne(proObj).then((response) => {
                resolve(response.insertedId)
            })
        })
    },
    getProductuser: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCTS_COLLECTION).find({ $and: [{ isAvailable: true }, { quantity: { $gte: 0 } }] }).toArray()
            resolve(products)
        })
    },
    getProduct: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCTS_COLLECTION).find({ isAvailable: true }).toArray()
            resolve(products)
        })
    },
    getProductMen: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCTS_COLLECTION).find({ category: "MEN" }).toArray()
            resolve(products)
        })
    },
    deleProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    isAvailable: false
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    detesProduct: (proId) => {
        console.log(proId);
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collections.PRODUCTS_COLLECTION).findOne({ _id: objectId(proId) })
            resolve(product)
        })
    },
    editProduct: (proId, proData) => {
        return new Promise((resolve, reject) => {
            if (proData.imageFilename.length == 0) {
                db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                    $set: {
                        name: proData.name,
                        category: proData.category,
                        description: proData.description,
                        quantity: parseInt(proData.quantity),
                        price: proData.price,
                        offerprice: proData.offerprice
                    }
                }).then((data) => {
                    resolve(data)
                })
            }
            else {
                db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                    $set: {
                        name: proData.name,
                        category: proData.category,
                        description: proData.description,
                        quantity: parseInt(proData.quantity),
                        price: proData.price,
                        offerprice: proData.offerprice,
                        imageFilename: proData.imageFilename
                    }
                }).then((data) => {
                    resolve(data)
                })
            }
        })
    }
}