import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
  token: "rentwear_token",
  user: "rentwear_user",
  cart: "rentwear_cart",
  checkoutItems: "rentwear_checkout_items",
  booking: "rentwear_booking",
  orders: "rentwear_orders"
};

const AppContext = createContext(null);

const readJSON = (key, fallbackValue) => {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
};

const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getItemKey = (item) => `${item.productId}-${item.size}`;

const isSameCartItem = (firstItem, secondItem) =>
  firstItem.productId === secondItem.productId && firstItem.size === secondItem.size;

export function AppProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.token) || "");
  const [user, setUser] = useState(() => readJSON(STORAGE_KEYS.user, null));
  const [cart, setCart] = useState(() => readJSON(STORAGE_KEYS.cart, []));
  const [checkoutItems, setCheckoutItems] = useState(() =>
    readJSON(STORAGE_KEYS.checkoutItems, [])
  );
  const [booking, setBooking] = useState(() => readJSON(STORAGE_KEYS.booking, null));
  const [orders, setOrders] = useState(() => readJSON(STORAGE_KEYS.orders, []));

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.token, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.token);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      writeJSON(STORAGE_KEYS.user, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [user]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.cart, cart);
  }, [cart]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.checkoutItems, checkoutItems);
  }, [checkoutItems]);

  useEffect(() => {
    if (booking) {
      writeJSON(STORAGE_KEYS.booking, booking);
    } else {
      localStorage.removeItem(STORAGE_KEYS.booking);
    }
  }, [booking]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.orders, orders);
  }, [orders]);

  const setAuthData = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken || "");
    setUser(nextUser || null);
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setCheckoutItems([]);
    setBooking(null);
  };

  const addToCart = (product, size) => {
    const cartItem = {
      productId: product.id,
      name: product.name,
      image: product.image,
      pricePerDay: product.pricePerDay,
      size: size || product.defaultSize,
      quantity: 1
    };

    setCart((previousCart) => {
      const existingIndex = previousCart.findIndex((item) =>
        isSameCartItem(item, cartItem)
      );

      if (existingIndex === -1) {
        return [...previousCart, cartItem];
      }

      return previousCart.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });
  };

  const updateCartItemQuantity = (productId, size, nextQuantity) => {
    setCart((previousCart) => {
      if (nextQuantity <= 0) {
        return previousCart.filter(
          (item) => item.productId !== productId || item.size !== size
        );
      }

      return previousCart.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: nextQuantity }
          : item
      );
    });
  };

  const removeCartItem = (productId, size) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.productId !== productId || item.size !== size
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutItems([]);
    setBooking(null);
  };

  const placeOrder = ({ paymentMethod }) => {
    if (!booking || !booking.items?.length) {
      return null;
    }

    const order = {
      id: `RW-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      paymentMethod,
      ...booking
    };

    setOrders((previousOrders) => [order, ...previousOrders]);

    setCart((previousCart) =>
      previousCart.filter(
        (item) =>
          !booking.items.some((bookingItem) => isSameCartItem(item, bookingItem))
      )
    );

    setCheckoutItems([]);
    setBooking(null);

    return order;
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const contextValue = {
    token,
    user,
    cart,
    cartCount,
    checkoutItems,
    booking,
    orders,
    isAuthenticated: Boolean(token),
    setAuthData,
    setUser,
    logout,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    setCheckoutItems,
    setBooking,
    placeOrder,
    getItemKey
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}
