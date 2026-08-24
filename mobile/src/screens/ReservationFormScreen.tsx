import React, { useState } from 'react';
import {
  Alert,
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
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import type { MainDrawerScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import {
  reservationFormSchema,
  OCCASIONS,
  type Occasion,
  type ReservationFormField,
} from '../validation/reservationSchema';
import { ApiRequestError, createReservation } from '../api/reservations';
import { getPushToken } from '../notifications/push';

type Props = MainDrawerScreenProps<'Reservation'>;

const GUEST_COUNT_OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1);

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

type FieldErrors = Partial<Record<ReservationFormField, string>>;

export default function ReservationFormScreen(_props: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function onChangeDate(event: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) {
      setDate(selected);
    }
  }

  function onChangeTime(event: DateTimePickerEvent, selected?: Date) {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) {
      setTime(selected);
    }
  }

  async function handleSubmit() {
    const values = {
      firstName,
      lastName,
      email,
      phone,
      reservationDate: date ? toDateInputValue(date) : '',
      reservationTime: time ? toTimeInputValue(time) : '',
      guestCount: guestCount ?? undefined,
    };

    const result = reservationFormSchema.safeParse(values);
    const nextErrors: FieldErrors = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as ReservationFormField;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
    }

    if (!occasion) {
      nextErrors.occasion = 'Please select an option.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !result.success) {
      return;
    }

    setSubmitting(true);
    try {
      const pushToken = await getPushToken();
      const reservation = await createReservation({ ...result.data, pushToken });
      Alert.alert(
        'Booking confirmed',
        `Your confirmation code is ${reservation.confirmationCode}. Keep it handy to check your reservation status later.`,
      );
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDate(null);
      setTime(null);
      setGuestCount(null);
      setOccasion(null);
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors.length > 0) {
        const serverErrors: FieldErrors = {};
        for (const fieldError of error.fieldErrors) {
          const field = fieldError.field as ReservationFormField;
          serverErrors[field] = fieldError.message;
        }
        setErrors(serverErrors);
      }
      const message =
        error instanceof ApiRequestError
          ? error.message
          : 'Something went wrong. Please try again.';
      Alert.alert('Could not complete booking', message);
    } finally {
      setSubmitting(false);
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
        <View style={styles.card}>
          <Text style={styles.heading}>Reservation</Text>
          <Text style={styles.subheading}>Book your table with us</Text>

          <Field
            label="First Name"
            icon="person-outline"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            error={errors.firstName}
          />

          <Field
            label="Last Name"
            icon="person-outline"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            error={errors.lastName}
          />

          <Field
            label="Contact No."
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your contact number"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Field
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Text style={styles.label}>Timing for Booking</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.inputBox, styles.rowItem, errors.reservationDate && styles.inputBoxError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={date ? styles.inputText : styles.placeholderText}>
                {date ? formatDateDisplay(date) : 'Select date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputBox, styles.rowItem, errors.reservationTime && styles.inputBoxError]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={time ? styles.inputText : styles.placeholderText}>
                {time ? formatTimeDisplay(time) : 'Select time'}
              </Text>
            </TouchableOpacity>
          </View>
          {!!(errors.reservationDate || errors.reservationTime) && (
            <Text style={styles.errorText}>{errors.reservationDate ?? errors.reservationTime}</Text>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={date ?? new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onChangeDate}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={time ?? new Date()}
              mode="time"
              display="default"
              onChange={onChangeTime}
            />
          )}

          <Text style={styles.label}>Total Number of Person</Text>
          <View style={[styles.inputBox, errors.guestCount && styles.inputBoxError, styles.pickerBox]}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <Picker
              selectedValue={guestCount === null ? '' : String(guestCount)}
              onValueChange={(value: string) => setGuestCount(value === '' ? null : Number(value))}
              style={styles.picker}
              dropdownIconColor={colors.textMuted}
            >
              <Picker.Item label="Select number of persons" value="" color={colors.textMuted} />
              {GUEST_COUNT_OPTIONS.map((count) => (
                <Picker.Item key={count} label={String(count)} value={String(count)} />
              ))}
            </Picker>
          </View>
          {!!errors.guestCount && <Text style={styles.errorText}>{errors.guestCount}</Text>}

          <Text style={styles.label}>
            <Ionicons name="heart-outline" size={13} color={colors.textMuted} /> For
          </Text>
          <View style={styles.row}>
            <ToggleButton
              label="For Family"
              icon="people-outline"
              selected={occasion === 'FAMILY'}
              onPress={() => setOccasion('FAMILY')}
            />
            <ToggleButton
              label="For Couple"
              icon="heart-outline"
              selected={occasion === 'COUPLE'}
              onPress={() => setOccasion('COUPLE')}
            />
          </View>
          {!!errors.occasion && <Text style={styles.errorText}>{errors.occasion}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'BOOKING…' : '✦ CONFIRM BOOKING ✦'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        <Ionicons name={icon} size={13} color={colors.textMuted} /> {label}
      </Text>
      <View style={[styles.inputBox, error && styles.inputBoxError]}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
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

type ToggleButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

function ToggleButton({ label, icon, selected, onPress }: ToggleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.toggleButton, styles.rowItem, selected && styles.toggleButtonSelected]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={15}
        color={selected ? colors.white : colors.textMuted}
        style={styles.toggleIcon}
      />
      <Text style={[styles.toggleLabel, selected && styles.toggleLabelSelected]}>{label}</Text>
    </TouchableOpacity>
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
  inputText: {
    flex: 1,
    color: colors.textDark,
    fontSize: 14,
  },
  placeholderText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
  },
  pickerBox: {
    height: 46,
    marginBottom: 4,
    paddingLeft: 12,
    paddingRight: 0,
  },
  picker: {
    flex: 1,
    color: colors.textDark,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  rowItem: {
    flex: 1,
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    height: 44,
  },
  toggleButtonSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  toggleIcon: {
    marginRight: 2,
  },
  toggleLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleLabelSelected: {
    color: colors.white,
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
});
