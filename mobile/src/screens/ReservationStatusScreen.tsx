import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MainDrawerScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import {
  ApiRequestError,
  cancelReservation,
  lookupReservation,
  type ReservationResponse,
} from '../api/reservations';

type Props = MainDrawerScreenProps<'ReservationStatus'>;

type FieldErrors = {
  confirmationCode?: string;
  guestEmail?: string;
};

const CANCELLABLE_STATUSES: ReservationResponse['status'][] = ['PENDING', 'CONFIRMED'];

const STATUS_LABELS: Record<ReservationResponse['status'], string> = {
  PENDING: 'Pending confirmation',
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

const STATUS_COLORS: Record<ReservationResponse['status'], string> = {
  PENDING: colors.gold,
  CONFIRMED: colors.navy,
  SEATED: colors.navy,
  COMPLETED: colors.navy,
  CANCELLED: colors.danger,
  NO_SHOW: colors.danger,
};

function formatDateDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const reference = new Date();
  reference.setHours(hours, minutes, 0, 0);
  return reference.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ReservationStatusScreen(_props: Props) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | undefined>();

  function resetCancelForm() {
    setShowCancelForm(false);
    setCancelReason('');
    setCancelError(undefined);
  }

  async function handleCheckStatus() {
    Keyboard.dismiss();
    const nextErrors: FieldErrors = {};
    const trimmedCode = confirmationCode.trim();
    const trimmedEmail = guestEmail.trim();

    if (!trimmedCode) {
      nextErrors.confirmationCode = 'Enter your confirmation code.';
    }
    if (!trimmedEmail) {
      nextErrors.guestEmail = 'Enter the email used to book.';
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.guestEmail = 'Enter a valid email address.';
    }

    setErrors(nextErrors);
    setNotFound(false);
    setReservation(null);
    resetCancelForm();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await lookupReservation({
        confirmationCode: trimmedCode,
        guestEmail: trimmedEmail,
      });
      setReservation(result);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setNotFound(true);
      } else {
        const message =
          error instanceof ApiRequestError
            ? error.message
            : 'Something went wrong. Please try again.';
        setNotFound(false);
        nextErrors.confirmationCode = message;
        setErrors(nextErrors);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCancel() {
    if (!reservation) {
      return;
    }

    setCancelError(undefined);
    setCancelling(true);
    try {
      const updated = await cancelReservation({
        confirmationCode: reservation.confirmationCode,
        guestEmail: guestEmail.trim(),
        reason: cancelReason.trim() || undefined,
      });
      setReservation(updated);
      resetCancelForm();
      Alert.alert('Reservation cancelled', 'Your reservation has been cancelled.');
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Something went wrong. Please try again.';
      setCancelError(message);
    } finally {
      setCancelling(false);
    }
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
        <View style={styles.logoCircleSmall}>
          <Text style={styles.logoTextSmall}>ON</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Reservation Status</Text>
          <Text style={styles.subheading}>Look up your booking with your confirmation code</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              <Ionicons name="ticket-outline" size={13} color={colors.textMuted} /> Confirmation
              Code
            </Text>
            <View style={[styles.inputBox, errors.confirmationCode && styles.inputBoxError]}>
              <Ionicons name="ticket-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                placeholder="e.g. ON-AB12CD34"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            {!!errors.confirmationCode && (
              <Text style={styles.errorText}>{errors.confirmationCode}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              <Ionicons name="mail-outline" size={13} color={colors.textMuted} /> Email Address
            </Text>
            <View style={[styles.inputBox, errors.guestEmail && styles.inputBoxError]}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={guestEmail}
                onChangeText={setGuestEmail}
                placeholder="Enter the email used to book"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {!!errors.guestEmail && <Text style={styles.errorText}>{errors.guestEmail}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleCheckStatus}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'CHECKING…' : '✦ CHECK STATUS ✦'}
            </Text>
          </TouchableOpacity>

          {notFound && (
            <View style={styles.notice}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.noticeText}>
                No reservation matches that code and email. Double-check both and try again.
              </Text>
            </View>
          )}

          {reservation && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultCode}>{reservation.confirmationCode}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[reservation.status] },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {STATUS_LABELS[reservation.status]}
                  </Text>
                </View>
              </View>

              <ResultRow
                icon="calendar-outline"
                label="Date"
                value={formatDateDisplay(reservation.reservationDate)}
              />
              <ResultRow
                icon="time-outline"
                label="Time"
                value={formatTimeDisplay(reservation.reservationTime)}
              />
              <ResultRow
                icon="people-outline"
                label="Party size"
                value={`${reservation.guestCount} ${reservation.guestCount === 1 ? 'guest' : 'guests'}`}
              />
              {!!reservation.specialRequest && (
                <ResultRow
                  icon="chatbubble-ellipses-outline"
                  label="Special request"
                  value={reservation.specialRequest}
                />
              )}

              {CANCELLABLE_STATUSES.includes(reservation.status) && !showCancelForm && (
                <TouchableOpacity
                  style={styles.cancelLinkButton}
                  onPress={() => setShowCancelForm(true)}
                >
                  <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
                  <Text style={styles.cancelLinkText}>Cancel this reservation</Text>
                </TouchableOpacity>
              )}

              {showCancelForm && (
                <View style={styles.cancelForm}>
                  <Text style={styles.label}>Reason (optional)</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      placeholder="e.g. Travel change"
                      placeholderTextColor={colors.textMuted}
                      style={styles.textInput}
                    />
                  </View>
                  {!!cancelError && <Text style={styles.errorText}>{cancelError}</Text>}
                  <View style={styles.cancelFormActions}>
                    <TouchableOpacity
                      style={styles.cancelFormSecondaryButton}
                      onPress={resetCancelForm}
                      disabled={cancelling}
                    >
                      <Text style={styles.cancelFormSecondaryText}>Never mind</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.cancelFormPrimaryButton,
                        cancelling && styles.submitButtonDisabled,
                      ]}
                      onPress={handleConfirmCancel}
                      disabled={cancelling}
                    >
                      <Text style={styles.cancelFormPrimaryText}>
                        {cancelling ? 'CANCELLING…' : 'CONFIRM CANCELLATION'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type ResultRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function ResultRow({ icon, label, value }: ResultRowProps) {
  return (
    <View style={styles.resultRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} style={styles.resultRowIcon} />
      <Text style={styles.resultRowLabel}>{label}</Text>
      <Text style={styles.resultRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  logoCircleSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoTextSmall: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  heading: {
    textAlign: 'center',
    color: colors.navy,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subheading: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputBoxError: {
    borderColor: colors.danger,
  },
  textInput: {
    flex: 1,
    color: colors.textDark,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(179, 38, 30, 0.08)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  noticeText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  resultCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultCode: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  resultRowIcon: {
    width: 18,
  },
  resultRowLabel: {
    color: colors.textMuted,
    fontSize: 12,
    width: 90,
  },
  resultRowValue: {
    flex: 1,
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cancelLinkText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cancelFormActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelFormSecondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormSecondaryText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelFormPrimaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormPrimaryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
