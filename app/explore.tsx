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
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '../src/context/CartContext';
import { useTenant } from '../src/context/TenantContext';
import { getProductsByTenant, type Product } from '../src/services/baserow';
import { postTenantInteractionEvent } from '../src/services/tenantEvents';
import { APP_BACKGROUND, CARD_BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from '../theme/appShell';
import { fontFamily, useOdenixFonts } from '../theme/fonts';

const textPrimary = TEXT_PRIMARY;
const textSecondary = TEXT_SECONDARY;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { useCustomFonts } = useOdenixFonts();
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

  const font = (family: string | undefined) =>
    useCustomFonts && family ? { fontFamily: family } : {};

  const tabClearance = 92 + Math.max(insets.bottom, 10);

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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: APP_BACKGROUND }]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.screen, { backgroundColor: APP_BACKGROUND }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabClearance + 48 },
        ]}
        showsVerticalScrollIndicator={false}
        onRefresh={() => {
          void loadProducts(true);
        }}
        refreshing={refreshing}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text
              style={[
                styles.title,
                { color: textPrimary },
                font(fontFamily.headingExtraBold),
              ]}
            >
              {isCitas ? 'Agendar' : 'Explorar'}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: textSecondary },
                font(fontFamily.body),
              ]}
            >
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
            <Text
              style={[styles.emptyText, { color: textSecondary }, font(fontFamily.body)]}
            >
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
                  borderColor: CARD_BORDER,
                  backgroundColor: '#FFFFFF',
                },
              ]}
            >
              {item.imagenUrl ? (
                <Image source={{ uri: item.imagenUrl }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: textSecondary },
                      font(fontFamily.body),
                    ]}
                  >
                    Sin imagen
                  </Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <Text
                  style={[
                    styles.productName,
                    { color: textPrimary },
                    font(fontFamily.headingSemi),
                  ]}
                >
                  {item.nombre}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.productDescription,
                    { color: textSecondary },
                    font(fontFamily.body),
                  ]}
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
                      font(fontFamily.headingBold),
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
                    <Text style={[styles.ctaPillText, font(fontFamily.bodyMedium)]}>
                      {isCitas ? 'Agendar' : 'Pedir'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
      {!isCitas && totalItems > 0 ? (
        <View style={[styles.cartBarWrap, { bottom: tabClearance }]}>
          <BlurView intensity={64} tint="light" style={styles.cartBarBlur} />
          <View
            style={[
              styles.cartBarOverlay,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
              },
            ]}
          />
          <View style={styles.cartBarContent}>
            <View>
              <Text
                style={[
                  styles.cartTitle,
                  { color: textPrimary },
                  font(fontFamily.bodyMedium),
                ]}
              >
                {totalItems} item{totalItems > 1 ? 's' : ''} en carrito
              </Text>
              <Text
                style={[
                  styles.cartSubtotal,
                  { color: tenant.colorPrimario },
                  font(fontFamily.headingBold),
                ]}
              >
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
                <Text style={[styles.cartClearText, font(fontFamily.bodyMedium)]}>
                  Limpiar
                </Text>
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
                <Text style={[styles.cartCheckoutText, font(fontFamily.bodyMedium)]}>
                  Pedir
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
    borderRadius: 15,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
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
    backgroundColor: '#F5F5F5',
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
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
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
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cartClearText: {
    color: TEXT_PRIMARY,
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
