var db = require("../config/connection")
var collections = require("../config/collections")
var bcrypt = require('bcrypt')
const { response } = require("express")
var objectId = require('mongodb').ObjectId
module.exports = {
    addToCart: (proId, userId) => {
        proObj = {
            item: objectId(proId),
            Qty: 1,
            productstatus: "pending"
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CARTS_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex((product) => { return product.item == proId })
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collections.CARTS_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) }, {
                        $inc: { 'products.$.Qty': 1 }
                    }).then(() => {
                        db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                            $inc: {
                                quantity: -1
                            }
                        })
                        resolve()
                    })
                }
                else {
                    db.get().collection(collections.CARTS_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: { "products": proObj }
                    }).then((response) => {
                        db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                            $inc: {
                                quantity: -1
                            }
                        })
                        resolve(response)
                    })
                }
            }
            else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collections.CARTS_COLLECTION).insertOne(cartObj).then((response) => {
                    db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                        $inc: {
                            quantity: -1
                        }
                    })
                    resolve(response)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CARTS_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: "$products"
                }
                ,
                {
                    $project: {
                        item: "$products.item",
                        Qty: "$products.Qty",
                    }
                }
                ,
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: "_id",
                        as: "product"
                    }
                }
                ,
                {
                    $project: {
                        item: 1,
                        Qty: 1,
                        product: {
                            $arrayElemAt: ["$product", 0]
                        }
                    }
                }
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })
    },
    changeQuantity: (details) => {
        let value = parseInt(details.value)
        let Qty = parseInt(details.Qty)
        let stock = parseInt(details.stock)
        return new Promise(async (resolve, reject) => {
            console.log(details);
            if (stock <= 0 && value == 1) {
                console.warn("here");
                resolve({ outOfStock: true })
            }
            else {
                if (Qty == 1 && value == -1) {
                    await db.get().collection(collections.CARTS_COLLECTION).updateOne({ _id: objectId(details.cart), "products.item": objectId(details.product) }, {
                        $pull: { "products": { "item": objectId(details.product) } }
                    }).then(async (response) => {
                        await db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(details.product) }, {
                            $inc: {
                                quantity: 1
                            }
                        })
                        resolve({ removeProduct: true })
                    })
                }
                else {
                    if (stock != 0 && value == 1) {
                        await db.get().collection(collections.CARTS_COLLECTION).updateOne({ _id: objectId(details.cart), "products.item": objectId(details.product) }, {
                            $inc: { "products.$.Qty": value }
                        }).then(async () => {
                            await db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(details.product) }, {
                                $inc: {
                                    quantity: -1
                                }
                            })
                            resolve({change:true})
                        })
                    }
                    else {
                        await db.get().collection(collections.CARTS_COLLECTION).updateOne({ _id: objectId(details.cart), "products.item": objectId(details.product) }, {
                            $inc: { "products.$.Qty": value }
                        }).then(async () => {
                            await db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(details.product) }, {
                                $inc: {
                                    quantity: 1
                                }
                            })
                            resolve({change:true})
                        })
                    }
                }
            }

        })
    },
    deleteProduct: (details) => {
        let qtyChange = parseInt(details.Qty)
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.CARTS_COLLECTION).updateOne({ _id: objectId(details.cart), "products.item": objectId(details.product) },
                {
                    $pull: {
                        'products': {
                            "item": objectId(details.product)
                        }
                    }
                }).then(() => {
                    db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: objectId(details.product) }, {
                        $inc: {
                            quantity: qtyChange
                        }
                    })
                    resolve({ removeProduct: true })
                })
        })
    },
    getTotalOfProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.CARTS_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                }
                ,
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        Qty: "$products.Qty"
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: "item",
                        foreignField: "_id",
                        as: "product"
                    }
                }
                ,
                {
                    $project: {
                        item: 1,
                        Qty: 1,
                        product: {
                            $arrayElemAt: ["$product", 0]
                        }
                    }
                },
                {
                    $project: {
                        Qty: 1,
                        price: "$product.offerprice"
                    }
                },
                {
                    $addFields: {
                        finalprice: { $toInt: "$price" }
                    }
                }
                ,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$Qty", "$finalprice"] } }
                    }
                }
            ]).toArray()
            console.log(total);
            resolve(total[0].total)
        })
    }
}