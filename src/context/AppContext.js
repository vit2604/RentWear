import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialProducts } from "../data/products";

const STORAGE_KEYS = {
  token: "rentwear_token",
  user: "rentwear_user",
  products: "rentwear_products",
  cart: "rentwear_cart",
  checkoutItems: "rentwear_checkout_items",
  booking: "rentwear_booking",
  orders: "rentwear_orders"
};

const AppContext = createContext(null);

const LEGACY_CATEGORY_MAP = {
  Vay: "Váy",
  "Ao Khoac": "Áo khoác",
  Ao: "Áo",
  Dam: "Đầm",
  Khac: "Khác"
};

const LEGACY_DESCRIPTION_MAP = {
  "Vay linen dang suong, hop di tiec nhe va su kien cuoi tuan.":
    "Váy linen dáng suông, hợp đi tiệc nhẹ và sự kiện cuối tuần.",
  "Blazer phom dang dung, chat lieu mem nhe, de phoi nhieu phong cach.":
    "Blazer phom dáng đứng, chất liệu mềm nhẹ, dễ phối nhiều phong cách.",
  "Jumpsuit mau trung tinh, ton dang va phu hop chup anh ngoai canh.":
    "Jumpsuit màu trung tính, tôn dáng và phù hợp chụp ảnh ngoại cảnh.",
  "Bo suit cao cap danh cho su kien trang trong, tong mau trang kem.":
    "Bộ suit cao cấp dành cho sự kiện trang trọng, tông màu trắng kem.",
  "Cardigan mem nhe, hop layering cho phong cach thu dong.":
    "Cardigan mềm nhẹ, hợp layering cho phong cách thu đông.",
  "Dam satin sang trong, phu hop tiec toi va chup lookbook.":
    "Đầm satin sang trọng, phù hợp tiệc tối và chụp lookbook."
};

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

const createProductId = () => `P${Date.now()}`;

const normalizeSizeOptions = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value : ["M"];
  }

  if (typeof value !== "string") {
    return ["M"];
  }

  const options = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return options.length ? options : ["M"];
};

const normalizeProductPayload = (productPayload = {}, fallbackProduct = null) => {
  const sizeOptions = normalizeSizeOptions(
    productPayload.sizeOptions ?? fallbackProduct?.sizeOptions ?? ["M"]
  );

  const stock = Math.max(1, Number(productPayload.stock ?? fallbackProduct?.stock ?? 1));
  const rented = Math.max(
    0,
    Math.min(stock, Number(productPayload.rented ?? fallbackProduct?.rented ?? 0))
  );

  const defaultSize =
    productPayload.defaultSize ||
    fallbackProduct?.defaultSize ||
    sizeOptions[0] ||
    "M";

  const rawCategory = String(
    productPayload.category ?? fallbackProduct?.category ?? "Khác"
  ).trim();
  const normalizedCategory = LEGACY_CATEGORY_MAP[rawCategory] || rawCategory;

  const rawDescription = String(
    productPayload.description ?? fallbackProduct?.description ?? ""
  ).trim();
  const normalizedDescription = LEGACY_DESCRIPTION_MAP[rawDescription] || rawDescription;

  return {
    id: fallbackProduct?.id || createProductId(),
    name: String(productPayload.name ?? fallbackProduct?.name ?? "").trim(),
    category: normalizedCategory || "Khác",
    pricePerDay: Math.max(
      1000,
      Number(productPayload.pricePerDay ?? fallbackProduct?.pricePerDay ?? 1000)
    ),
    sizeOptions,
    defaultSize: sizeOptions.includes(defaultSize) ? defaultSize : sizeOptions[0],
    stock,
    rented,
    image:
      String(productPayload.image ?? fallbackProduct?.image ?? "").trim() ||
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    description: normalizedDescription,
    blockedDates: fallbackProduct?.blockedDates ?? []
  };
};

export function AppProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.token) || "");
  const [user, setUser] = useState(() => readJSON(STORAGE_KEYS.user, null));
  const [products, setProducts] = useState(() => {
    const savedProducts = readJSON(STORAGE_KEYS.products, initialProducts);

    if (!Array.isArray(savedProducts) || !savedProducts.length) {
      return initialProducts.map((product) => normalizeProductPayload(product, product));
    }

    return savedProducts.map((product) => normalizeProductPayload(product, product));
  });
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
    writeJSON(STORAGE_KEYS.products, products);
  }, [products]);

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

  const addProduct = (productPayload) => {
    const normalizedProduct = normalizeProductPayload(productPayload);
    setProducts((previousProducts) => [normalizedProduct, ...previousProducts]);
    return normalizedProduct;
  };

  const updateProduct = (productId, productPayload) => {
    let updatedProduct = null;

    setProducts((previousProducts) =>
      previousProducts.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        updatedProduct = normalizeProductPayload(productPayload, product);
        return updatedProduct;
      })
    );

    if (!updatedProduct) {
      return null;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              name: updatedProduct.name,
              image: updatedProduct.image,
              pricePerDay: updatedProduct.pricePerDay,
              size: updatedProduct.sizeOptions.includes(item.size)
                ? item.size
                : updatedProduct.defaultSize
            }
          : item
      )
    );

    setCheckoutItems((previousCheckoutItems) =>
      previousCheckoutItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              name: updatedProduct.name,
              image: updatedProduct.image,
              pricePerDay: updatedProduct.pricePerDay,
              size: updatedProduct.sizeOptions.includes(item.size)
                ? item.size
                : updatedProduct.defaultSize
            }
          : item
      )
    );

    return updatedProduct;
  };

  const removeProduct = (productId) => {
    setProducts((previousProducts) =>
      previousProducts.filter((product) => product.id !== productId)
    );

    setCart((previousCart) =>
      previousCart.filter((item) => item.productId !== productId)
    );

    setCheckoutItems((previousCheckoutItems) =>
      previousCheckoutItems.filter((item) => item.productId !== productId)
    );

    setBooking((previousBooking) => {
      if (!previousBooking?.items?.length) {
        return previousBooking;
      }

      const nextItems = previousBooking.items.filter(
        (item) => item.productId !== productId
      );

      if (!nextItems.length) {
        return null;
      }

      const subtotal = nextItems.reduce(
        (total, item) => total + item.pricePerDay * item.quantity * previousBooking.days,
        0
      );
      const shippingFee = previousBooking.shippingFee || 0;
      const discount = previousBooking.days >= 5 ? Math.round(subtotal * 0.05) : 0;

      return {
        ...previousBooking,
        items: nextItems,
        subtotal,
        discount,
        total: subtotal + shippingFee - discount
      };
    });
  };

  const placeOrder = ({ paymentMethod }) => {
    if (!booking || !booking.items?.length) {
      return null;
    }

    const isOnlinePayment = ["vnpay", "momo"].includes(paymentMethod);

    const order = {
      id: `RW-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      paymentMethod,
      paymentStatus: isOnlinePayment ? "pending" : "paid",
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

  const updateOrderStatus = (orderId, nextPaymentStatus) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId
          ? { ...order, paymentStatus: nextPaymentStatus }
          : order
      )
    );
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const isAdmin = useMemo(() => {
    if (!user?.email) {
      return false;
    }

    if (user.role === "admin") {
      return true;
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    return (
      normalizedEmail === "admin@rentwear.com" ||
      normalizedEmail === "admin@rentwear.local"
    );
  }, [user]);

  const contextValue = {
    token,
    user,
    products,
    cart,
    cartCount,
    checkoutItems,
    booking,
    orders,
    isAuthenticated: Boolean(token),
    isAdmin,
    setAuthData,
    setUser,
    logout,
    addProduct,
    addToCart,
    updateProduct,
    updateCartItemQuantity,
    removeProduct,
    removeCartItem,
    clearCart,
    setCheckoutItems,
    setBooking,
    placeOrder,
    updateOrderStatus,
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
