import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { useCart } from '../src/context/CartContext';
import { useTenant } from '../src/context/TenantContext';
import { getProductsByTenant, type Product } from '../src/services/baserow';
import { postTenantInteractionEvent } from '../src/services/tenantEvents';

const bgLight = '#F8F9FA';
const bgDark = '#0B0410';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { tenant } = useTenant();
  const isCitas = tenant.plantilla === 'citas';
  const {
    items,
    totalItems,
    subtotal,
    addItem,
    clearCart,
    buildCheckoutSummary,
    buildWhatsappCheckoutUrl,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.16)'
    : 'rgba(76, 29, 149, 0.14)';
  const cardOverlay = isDark
    ? 'rgba(46, 16, 101, 0.26)'
    : 'rgba(255, 255, 255, 0.58)';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#4B5563';

  const loadProducts = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const data = await getProductsByTenant(tenant.id);
    setProducts(data);

    if (isPullToRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [tenant.id]);

  const emptyMessage = useMemo(() => {
    if (loading) return isCitas ? 'Cargando servicios...' : 'Cargando catálogo...';
    return isCitas
      ? 'Aún no hay servicios publicados para agendar.'
      : 'Aún no hay productos publicados para este tenant.';
  }, [loading, isCitas]);

  const openWhatsappForProduct = async (product: Product) => {
    const cleanPhone = tenant.whatsapp.replace(/[^\d]/g, '');
    const message = isCitas
      ? `Hola ${tenant.nombre}, quiero agendar: ${product.nombre}. ¿Qué disponibilidad tienen?`
      : `Hola ${tenant.nombre}, me interesa el producto ${product.nombre}`;
    await postTenantInteractionEvent({
      tipo: isCitas ? 'cita' : 'pedido',
      detalle: message,
      total: isCitas ? 0 : product.precio,
    });
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  const onPressProduct = (product: Product) => {
    if (isCitas) {
      Alert.alert(
        'Agendar por WhatsApp',
        `¿Deseas solicitar cita o información para “${product.nombre}”?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, escribir por WhatsApp',
            onPress: () => {
              void openWhatsappForProduct(product);
            },
          },
        ],
        { cancelable: true },
      );
      return;
    }

    Alert.alert(
      'Agregar al carrito',
      '¿Deseas agregar este producto al carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, agregar',
          onPress: () => {
            addItem(product, 1);
          },
        },
        {
          text: 'Pedir ahora',
          onPress: () => {
            void openWhatsappForProduct(product);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const openCartCheckout = async () => {
    if (items.length === 0) return;
    const { message, total } = buildCheckoutSummary(tenant);
    await postTenantInteractionEvent({ tipo: 'pedido', detalle: message, total });
    const url = buildWhatsappCheckoutUrl(tenant);
    await Linking.openURL(url);
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? bgDark : bgLight },
      ]}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={() => {
          void loadProducts(true);
        }}
        refreshing={refreshing}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={[styles.title, { color: textPrimary }]}>
              {isCitas ? 'Agendar' : 'Explorar'}
            </Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              {isCitas
                ? `Servicios y solicitudes en vivo · ${tenant.nombre}`
                : `Catálogo en vivo de ${tenant.nombre}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {loading ? (
              <ActivityIndicator size="large" color={tenant.colorPrimario} />
            ) : null}
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              {emptyMessage}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressProduct(item)}
            style={({ pressed }) => [
              styles.cardWrap,
              { transform: [{ scale: pressed ? 0.985 : 1 }] },
            ]}
          >
            <View
              style={[
                styles.card,
                {
                  borderColor: cardBorderColor,
                },
              ]}
            >
              <BlurView
                intensity={isDark ? 44 : 30}
                tint={isDark ? 'dark' : 'light'}
                experimentalBlurMethod={
                  Platform.OS === 'android' ? 'dimezisBlurView' : undefined
                }
                style={styles.cardBlur}
              />
              <View
                pointerEvents="none"
                style={[styles.cardOverlay, { backgroundColor: cardOverlay }]}
              />

              {item.imagenUrl ? (
                <Image source={{ uri: item.imagenUrl }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={[styles.imagePlaceholderText, { color: textSecondary }]}>
                    Sin imagen
                  </Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <Text style={[styles.productName, { color: textPrimary }]}>
                  {item.nombre}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.productDescription, { color: textSecondary }]}
                >
                  {item.descripcionCorta}
                </Text>
                <View style={styles.cardFooter}>
                  <Text
                    style={[
                      styles.price,
                      {
                        color: tenant.colorPrimario,
                      },
                    ]}
                  >
                    {formatCurrency(item.precio)}
                  </Text>
                  <View
                    style={[
                      styles.ctaPill,
                      { backgroundColor: tenant.colorPrimario },
                    ]}
                  >
                    <Text style={styles.ctaPillText}>{isCitas ? 'Agendar' : 'Pedir'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
      {!isCitas && totalItems > 0 ? (
        <View style={styles.cartBarWrap}>
          <BlurView
            intensity={isDark ? 48 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={styles.cartBarBlur}
          />
          <View
            style={[
              styles.cartBarOverlay,
              {
                backgroundColor: isDark
                  ? 'rgba(46, 16, 101, 0.3)'
                  : 'rgba(255, 255, 255, 0.65)',
              },
            ]}
          />
          <View style={styles.cartBarContent}>
            <View>
              <Text style={[styles.cartTitle, { color: textPrimary }]}>
                {totalItems} item{totalItems > 1 ? 's' : ''} en carrito
              </Text>
              <Text style={[styles.cartSubtotal, { color: tenant.colorPrimario }]}>
                {formatCurrency(subtotal)}
              </Text>
            </View>
            <View style={styles.cartActions}>
              <Pressable
                onPress={clearCart}
                style={({ pressed }) => [
                  styles.cartClearBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.cartClearText}>Limpiar</Text>
              </Pressable>
              <Pressable
                onPress={openCartCheckout}
                style={({ pressed }) => [
                  styles.cartCheckoutBtn,
                  {
                    backgroundColor: tenant.colorPrimario,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.cartCheckoutText}>Pedir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 120,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
    gap: 14,
  },
  headerWrap: {
    paddingBottom: 6,
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardWrap: {
    borderRadius: 20,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#312e81',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: { elevation: 7 },
      default: {},
    }),
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.12)',
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 40,
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 19,
    fontWeight: '800',
  },
  ctaPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyWrap: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  cartBarWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  cartBarBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  cartBarOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cartBarContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cartTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  cartSubtotal: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartClearBtn: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.24)',
  },
  cartClearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cartCheckoutBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cartCheckoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
