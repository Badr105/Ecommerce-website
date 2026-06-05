import { useCart } from '../context/CartContext';

export default function Checkout() {
    const {getCartItemsWithProducts, removeFromCart, updateQuantity, getCartTotal, clearCart} = useCart();
    const cartItems = getCartItemsWithProducts();
    const total = getCartTotal();

    async function placeOrder() {
        // Build order information to send to backend
        const order = {
            items: cartItems.map(i => ({ id: i.id, productId: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
            total: total,
            customerId: 'payplus-paywall-poc',
            orderId: `order-${Date.now()}`
        };

        try {
            const res = await fetch('/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            if (!res.ok) throw new Error('Payment initialization failed');
            const data = await res.json();

            // Create a form and submit to the paywall URL returned by server
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = data.paywallUrl || 'https://test-paywall.url.ma/launch';
            form.style.display = 'none';

            const payloadInput = document.createElement('input');
            payloadInput.type = 'hidden';
            payloadInput.name = 'payload';
            payloadInput.value = data.payload || '';
            form.appendChild(payloadInput);

            const signatureInput = document.createElement('input');
            signatureInput.type = 'hidden';
            signatureInput.name = 'signature';
            signatureInput.value = data.signature || '';
            form.appendChild(signatureInput);

            document.body.appendChild(form);
            form.submit();

            clearCart();
        } catch (err) {
            console.error(err);
            alert('Unable to start payment. See console for details.');
        }
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Checkout</h1>
                <div className="checkout-container">
                    <div className="checkout-items">
                        <h2 className="checkout-section-title">Order Summary</h2>
                        {cartItems.map((item) => (
                            <div className="checkout-item" key={item.id}>
                                <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="checkout-item-image"
                                />
                                <div className="checkout-item-details">
                                    <h3 className="checkout-item-name">{item.product.name}</h3>
                                    <p className="checkout-item-price">
                                        {item.product.price} MAD each
                                    </p>
                                </div>
                                <div className="checkout-item-controls">
                                    <div className="quantity-controls">
                                        <button 
                                            className="quantity-btn" 
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            -
                                        </button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button 
                                            className="quantity-btn" 
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <p className="checkout-item-total">
                                        {item.product.price * item.quantity.toFixed(2)} MAD
                                    </p>
                                    <button 
                                        className="btn btn-secondary btn-small"
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-summary">
                        <h2 className="checkout-section-title">Total</h2>
                        <div className="checkout-total">
                            <p className="checkout-total-label">Subtotal:</p>
                            <p className="checkout-total-value">{total.toFixed(2)} MAD</p>
                        </div>
                        <div className="checkout-total">
                            <p className="checkout-total-label">Total:</p>
                            <p className="checkout-total-value checkout-total-final">{total.toFixed(2)} MAD</p>
                        </div>
                        <button className="btn btn-primary btn-block btn-large" onClick={() => placeOrder()}>
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}