import vuex from 'vuex'
import vue from 'vue'
import shop from '@/api/shop.js'

//use middleware
vue.use(vuex)

export default new vuex.Store({
    state: { //equivalent with data
        products : [],
        cart : [],
        checkoutStatus : null
    },

    getters: { //equivalent to computed properties
        availableProducts(state){
            return state.products.filter(product => product.inventory > 0 )
        },

        itemsInCart(state){
            return state.cart.map(cartItem => {
                const product = state.products.find(product => product.id === cartItem.id)
                return {
                  title: product.title,
                  price: product.price,
                  quantity: cartItem.quantity
                }
              })
        },

        cartTotal(state, getters){
            let total = 0
            getters.itemsInCart.forEach(item =>{
                total = total + item.price*item.quantity
            })
            return total
        },

        productIsInStock(product){
            return (product) =>{
                return  product.inventory > 0 
            }
        }
    },

    actions: { //equivalent to methods properties
        fetchProducts(context){
            return new Promise((resolve, reject) => {
                shop.getProducts(products => { //get the products from shop and  update with store.commit (note:shop is api and store is vuex storage)
                    context.commit('setProducts', products)
                    resolve()      
                })        
            })
        },

        addProductToCart(context, product){
            if(product.inventory > 0){
                const cartItem = context.state.cart.find(item => item.id === product.id) //check if the item is in cart

                if(!cartItem){ //if item not in cart
                    context.commit('pushToCart', product.id)
                }else{ //if item is in cart
                    context.commit('incrementItemQuantity', cartItem)
                }

                context.commit('decrementProductInventory', product) //also reducing the product inventory
            }
        },

        checkout(context){
            shop.buyProducts(
                context.state.cart, 
                ()=>{ //success
                    context.commit('emptyCart')
                    context.commit('setCheckoutStatus', 'success')
                },
                ()=>{//failure
                    context.commit('setCheckoutStatus', 'failed')
                }
            )
        }
    },

    mutations: { //setting and update the state
        setProducts(state, products){
            state.products = products
        },
        
        pushToCart(state, productId){
            const itemToCart = {
                id : productId,
                quantity : 1
            }

            state.cart.push(itemToCart)
        },

        incrementItemQuantity(state, cartItem){
            cartItem.quantity++
        },

        decrementProductInventory(state, product){
            product.inventory--
        },

        setCheckoutStatus(state, status){
            state.checkoutStatus = status
        },

        emptyCart(state){
            state.cart = []
        }
    }

})