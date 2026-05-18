import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

const FILTERS = ["All", "Cleanser", "Serum", "Moisturizer", "Sunscreen"] as const;

const PRODUCTS = [
  { id: "1", name: "CeraVe Foaming Cleanser", brand: "CeraVe", type: "Cleanser", price: "$14.99", rating: 4.8, reviews: 12400, color: "#3B82F6", icon: "water-outline" as const, badge: "Best Seller" },
  { id: "2", name: "The Ordinary Niacinamide 10%", brand: "The Ordinary", type: "Serum", price: "$5.90", rating: 4.7, reviews: 8900, color: "#A58BFF", icon: "flask-outline" as const, badge: "AI Recommended" },
  { id: "3", name: "Neutrogena Hydro Boost", brand: "Neutrogena", type: "Moisturizer", price: "$19.99", rating: 4.6, reviews: 6700, color: "#22C55E", icon: "leaf-outline" as const, badge: null },
  { id: "4", name: "La Roche-Posay SPF 50+", brand: "La Roche-Posay", type: "Sunscreen", price: "$18.50", rating: 4.9, reviews: 15200, color: "#F59E0B", icon: "sunny-outline" as const, badge: "Top Pick" },
  { id: "5", name: "Vitamin C Brightening Serum", brand: "TruSkin", type: "Serum", price: "$19.99", rating: 4.5, reviews: 4800, color: "#F59E0B", icon: "sparkles-outline" as const, badge: null },
  { id: "6", name: "Cetaphil Gentle Cleanser", brand: "Cetaphil", type: "Cleanser", price: "$12.99", rating: 4.7, reviews: 9200, color: "#3B82F6", icon: "water-outline" as const, badge: null },
  { id: "7", name: "The Inkey List Hyaluronic Acid", brand: "The Inkey List", type: "Serum", price: "$7.99", rating: 4.6, reviews: 3400, color: "#7B61FF", icon: "flask-outline" as const, badge: "Budget Pick" },
  { id: "8", name: "EltaMD UV Clear SPF 46", brand: "EltaMD", type: "Sunscreen", price: "$39.00", rating: 4.9, reviews: 18500, color: "#F59E0B", icon: "sunny-outline" as const, badge: "Dermatologist" },
];

function ProductCard({ item, onAdd }: { item: typeof PRODUCTS[0]; onAdd: () => void }) {
  const colors = useColors();
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdded(true);
    onAdd();
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <GlassCard style={styles.productCard} padding={14}>
      <View style={styles.productRow}>
        <View style={[styles.productImg, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon} size={32} color={item.color} />
        </View>
        <View style={styles.productInfo}>
          {item.badge && (
            <View style={[styles.badge, { backgroundColor: `${item.color}15` }]}>
              <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
            </View>
          )}
          <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>{item.brand}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.foreground }]}>{item.rating}</Text>
            <Text style={[styles.reviewsText, { color: colors.mutedForeground }]}>
              ({item.reviews.toLocaleString()})
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{item.price}</Text>
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.8}
              style={styles.addBtnWrap}
            >
              {added ? (
                <View style={[styles.addBtn, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              ) : (
                <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.addBtn}>
                  <Ionicons name="add" size={14} color="white" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [cartCount, setCartCount] = useState(0);

  const filtered = filter === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.type === filter);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Product Recommendations</Text>
        <View style={styles.cartWrap}>
          <TouchableOpacity style={[styles.cartBtn, { backgroundColor: colors.lavender }]}>
            <Ionicons name="bag-outline" size={20} color={colors.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Products picked for your skin
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === f ? "white" : colors.mutedForeground }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard item={item} onAdd={() => setCartCount((c) => c + 1)} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Poppins_700Bold", textAlign: "center", marginLeft: -38 },
  cartWrap: { width: 38, alignItems: "center" },
  cartBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { fontSize: 9, fontFamily: "Poppins_700Bold", color: "white" },
  subtitle: { fontSize: 13, fontFamily: "Poppins_400Regular", paddingHorizontal: 20, marginBottom: 12, marginTop: 2 },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 16, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  filterText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  productCard: {},
  productRow: { flexDirection: "row", gap: 12 },
  productImg: {
    width: 72,
    height: 90,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  productInfo: { flex: 1 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  productName: { fontSize: 14, fontFamily: "Poppins_600SemiBold", lineHeight: 18 },
  productBrand: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2, marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
  ratingText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  reviewsText: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  addBtnWrap: {},
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
