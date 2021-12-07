import React, { useEffect } from 'react';
import {
  DefaultProps,
  Text,
  MantineSize,
  ClassNames,
  useExtractedMargins,
  useMantineTheme,
} from '@mantine/core';
import { upperFirst } from '@mantine/hooks';
import dayjs from 'dayjs';
import { FirstDayOfWeek } from '../../types';
import { getMonthDays, getWeekdaysNames } from '../../utils';
import { Day, DayStylesNames } from './Day/Day';
import { getDayProps, DayModifiers } from './get-day-props/get-day-props';
import useStyles from './Month.styles';

export interface MonthSettings {
  /** Adds className to day button based on date and modifiers */
  dayClassName?(date: Date, modifiers: DayModifiers): string;

  /** Adds style to day button based on date and modifiers */
  dayStyle?(date: Date, modifiers: DayModifiers): React.CSSProperties;

  /** When true dates that are outside of given month are not styled */
  disableOutsideDayStyle?: boolean;

  /** When true dates that are outside of given month cannot be clicked or focused */
  disableOutsideEvents?: boolean;

  /** Minimum possible date */
  minDate?: Date;

  /** Maximum possible date */
  maxDate?: Date;

  /** Callback function to determine if day should be disabled */
  excludeDate?(date: Date): boolean;

  /** Set to false to remove weekdays row */
  hideWeekdays?: boolean;

  /** Controls month days font-size and height */
  size?: MantineSize;

  /** Set to true to make calendar take 100% of container width */
  fullWidth?: boolean;

  /** Prevent focusing upon clicking */
  preventFocus?: boolean;

  /** Called when keydown event is registered on day */
  onDayKeyDown?(date: Date, event: React.KeyboardEvent): void;
}

export type MonthStylesNames = ClassNames<typeof useStyles> | DayStylesNames;

export interface MonthProps
  extends DefaultProps<MonthStylesNames>,
    MonthSettings,
    Omit<React.ComponentPropsWithoutRef<'table'>, 'onChange' | 'value'> {
  /** Date at which month should be shown */
  month: Date;

  /** Locale is used to get weekdays names with dayjs format */
  locale?: string;

  /** Selected date */
  value?: Date;

  /** Selected range */
  range?: [Date, Date];

  /** Autofocus selected date on mount, if no date is selected autofocus is applied to first month day */
  autoFocus?: boolean;

  /** Called when day is selected */
  onChange?(value: Date): void;

  /** Static css selector base */
  __staticSelector?: string;

  /** Called when onMouseEnter event fired on day button */
  onDayMouseEnter?(date: Date, event: React.MouseEvent): void;

  /** Set first day of the week */
  firstDayOfWeek?: FirstDayOfWeek;

  /** Get days buttons refs */
  daysRefs?: React.RefObject<Record<string, HTMLButtonElement>>;
}

const noop = () => {};

export function Month({
  className,
  style,
  month,
  value,
  onChange,
  autoFocus = false,
  disableOutsideEvents = false,
  locale,
  dayClassName,
  dayStyle,
  disableOutsideDayStyle = false,
  classNames,
  styles,
  minDate,
  maxDate,
  excludeDate,
  onDayMouseEnter,
  range,
  hideWeekdays = false,
  __staticSelector = 'Month',
  size = 'sm',
  fullWidth = false,
  preventFocus = false,
  sx,
  firstDayOfWeek = 'monday',
  onDayKeyDown,
  daysRefs,
  ...others
}: MonthProps) {
  const { classes, cx } = useStyles(
    { fullWidth },
    { sx, classNames, styles, name: __staticSelector }
  );
  const { mergedStyles, rest } = useExtractedMargins({ others, style });
  const theme = useMantineTheme();
  const finalLocale = locale || theme.datesLocale;
  const days = getMonthDays(month, firstDayOfWeek);

  useEffect(() => {
    if (autoFocus) {
      const date = new Date(
        month.getFullYear(),
        month.getMonth(),
        value ? value.getDate() : 1
      ).toISOString();

      if (date in daysRefs.current) {
        daysRefs.current[date].focus();
      }
    }
  }, []);

  const weekdays = getWeekdaysNames(finalLocale, firstDayOfWeek).map((weekday) => (
    <th className={classes.weekdayCell} key={weekday}>
      <Text size={size} className={classes.weekday}>
        {upperFirst(weekday)}
      </Text>
    </th>
  ));

  const hasValue = value instanceof Date;
  const hasValueInMonthRange =
    hasValue &&
    dayjs(value).isAfter(dayjs(month).startOf('month')) &&
    dayjs(value).isBefore(dayjs(month).endOf('month'));

  const rows = days.map((row, rowIndex) => {
    const cells = row.map((date, cellIndex) => {
      const dayProps = getDayProps({
        date,
        month,
        hasValue,
        minDate,
        maxDate,
        value,
        excludeDate,
        disableOutsideEvents,
        range,
      });

      const withoutStylesOutsideMonth = disableOutsideDayStyle && dayProps.outside;

      return (
        <td className={classes.cell} key={cellIndex}>
          <Day
            ref={(button) => {
              if (daysRefs?.current) {
                // eslint-disable-next-line no-param-reassign
                daysRefs.current[date.toISOString()] = button;
              }
            }}
            onClick={() => typeof onChange === 'function' && onChange(date)}
            onMouseDown={(event) => preventFocus && event.preventDefault()}
            value={date}
            outside={dayProps.outside}
            weekend={dayProps.weekend}
            inRange={dayProps.inRange && !withoutStylesOutsideMonth}
            firstInRange={dayProps.firstInRange}
            lastInRange={dayProps.lastInRange}
            firstInMonth={cellIndex === 0 && rowIndex === 0}
            selected={(dayProps.selected || dayProps.selectedInRange) && !withoutStylesOutsideMonth}
            hasValue={hasValueInMonthRange}
            onKeyDown={onDayKeyDown}
            className={typeof dayClassName === 'function' ? dayClassName(date, dayProps) : null}
            style={typeof dayStyle === 'function' ? dayStyle(date, dayProps) : null}
            styles={styles}
            classNames={classNames}
            disabled={dayProps.disabled}
            __staticSelector={__staticSelector}
            onMouseEnter={typeof onDayMouseEnter === 'function' ? onDayMouseEnter : noop}
            size={size}
            fullWidth={fullWidth}
          />
        </td>
      );
    });

    return <tr key={rowIndex}>{cells}</tr>;
  });

  return (
    <table className={cx(classes.root, className)} style={mergedStyles} {...rest}>
      {!hideWeekdays && (
        <thead>
          <tr>{weekdays}</tr>
        </thead>
      )}
      <tbody>{rows}</tbody>
    </table>
  );
}

Month.displayName = '@mantine/core/Month';