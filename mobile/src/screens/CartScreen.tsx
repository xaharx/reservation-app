import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import type { MainDrawerScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { ApiRequestError, createOrder } from '../api/orders';
import { getPushToken } from '../notifications/push';

type Props = MainDrawerScreenProps<'Cart'>;

const guestDetailsSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(191),
  // US phone numbers: optional +1/1 country code, then exactly 10 digits —
  // same pattern as mobile/src/validation/reservationSchema.ts.
  phone: z
    .string()
    .trim()
    .regex(/^(\+?1)?\d{10}$/, 'Enter a valid US phone number, e.g. +15551234567.'),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof guestDetailsSchema>, string>>;

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

export default function CartScreen({ navigation }: Props) {
  const { lines, subtotalCents, currency, updateQuantity, removeItem, clear } = useCart();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    confirmationCode: string;
    guestEmail: string;
  } | null>(null);

  async function handleCheckout() {
    const result = guestDetailsSchema.safeParse({ firstName, lastName, email, phone });
    const nextErrors: FieldErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
    }
    setErrors(nextErrors);

    if (!result.success || lines.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const pushToken = await getPushToken();
      const { order, checkoutUrl } = await createOrder({
        ...result.data,
        items: lines.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
        pushToken,
      });
      setPlacedOrder({ confirmationCode: order.confirmationCode, guestEmail: order.guestEmail });
      clear();
      await Linking.openURL(checkoutUrl);
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Something went wrong. Please try again.';
      Alert.alert('Could not start checkout', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) {
    return (
      <View style={styles.centered}>
        <View style={styles.confirmationCard}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.gold} />
          <Text style={styles.confirmationTitle}>Almost there</Text>
          <Text style={styles.confirmationText}>
            Finish paying in the browser that just opened. Your confirmation code is:
          </Text>
          <Text style={styles.confirmationCode}>{placedOrder.confirmationCode}</Text>
          <Text style={styles.confirmationHint}>
            Save this code — you'll need it with your email to check your order status.
          </Text>
          <TouchableOpacity
            style={styles.checkStatusButton}
            onPress={() =>
              navigation.navigate('OrderHistory', { confirmationCode: placedOrder.confirmationCode })
            }
          >
            <Text style={styles.checkStatusButtonText}>CHECK ORDER STATUS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newOrderButton} onPress={() => setPlacedOrder(null)}>
            <Text style={styles.newOrderButtonText}>Start a new order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cart-outline" size={40} color={colors.mutedOnDark} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add items from the Menu to get started.</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.browseButtonText}>BROWSE MENU</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Your Order</Text>

          {lines.map((line) => (
            <View key={line.menuItemId} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName}>{line.name}</Text>
                <Text style={styles.linePrice}>{formatPrice(line.unitCents, line.currency)}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => updateQuantity(line.menuItemId, line.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color={colors.navy} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{line.quantity}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => updateQuantity(line.menuItemId, line.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.navy} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeItem(line.menuItemId)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>
              {formatPrice(subtotalCents, currency ?? 'usd')}
            </Text>
          </View>

          <Text style={styles.sectionHeading}>Your Details</Text>

          <Field
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            error={errors.firstName}
          />
          <Field
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            error={errors.lastName}
          />
          <Field
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Field
            label="Contact No."
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your contact number"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <TouchableOpacity
            style={[styles.checkoutButton, submitting && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={submitting}
          >
            <Text style={styles.checkoutButtonText}>
              {submitting ? 'STARTING CHECKOUT…' : `✦ PAY ${formatPrice(subtotalCents, currency ?? 'usd')} ✦`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, error && styles.inputBoxError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.textInput}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  heading: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  linePrice: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperButton: {
    padding: 2,
  },
  stepperValue: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  subtotalLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  subtotalValue: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeading: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: 'center',
  },
  inputBoxError: {
    borderColor: colors.danger,
  },
  textInput: {
    color: colors.textDark,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    marginTop: 4,
  },
  checkoutButton: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyTitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.mutedOnDark,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  confirmationCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  confirmationTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  confirmationText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmationCode: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  confirmationHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 18,
  },
  checkStatusButton: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkStatusButtonText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  newOrderButton: {
    paddingVertical: 8,
  },
  newOrderButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
