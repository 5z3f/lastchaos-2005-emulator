import EventEmitter from "../../events";

export enum ModifierType {
    Additive,
    Percentual,
    Multiplicator,
    Divisor,
    Negative,
};

export enum ModifierOrigin {
    Hardcoding = -1,
    Command,
    Item,
    Skill,
    Monster,
    Quest,
};

export enum ModifierEffectType {
    Instant,
    Overtime,
};

export enum StatisticEvents {
    Change = 'statistic:change',
};

/**
 * Represents a statistic with a base value, minimum value, maximum value, and modifiers.
 * Emits events when the total value changes.
 */
export class Statistic extends EventEmitter<StatisticEvents> {
    baseValue = 0;
    minValue = 0;
    maxValue = 0;
    private _totalValue = 0;
    modifiers: Modifier[] = [];

    /**
     * Creates a new Statistic instance.
     * @param baseValue The base value of the statistic.
     * @param minValue The minimum value of the statistic.
     * @param maxValue The maximum value of the statistic.
     */
    constructor(baseValue = 0, minValue = 0, maxValue = 1000000) {
        super();

        this.baseValue = baseValue;
        this._totalValue = baseValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    /**
     * Sets the total value of the statistic.
     * @param value The new total value.
     */
    set totalValue(value: number) {
        // Check if baseValue is a float
        if (Number(this.baseValue) === this.baseValue && this.baseValue % 1 !== 0) {
            // If baseValue is a float, round value to 3 decimal places
            value = parseFloat(value.toFixed(3));
        } else {
            // If baseValue is not a float, ensure value is a number
            value = Math.round(value);
        }

        if (value !== this._totalValue) {
            this._totalValue = value;
            this.emit(StatisticEvents.Change, this);
        }
    }

    /**
     * Increases the total value of the statistic by the specified value, capped at the maximum value.
     * @param {number} value - The value to increase the statistic by.
     */
    increase(value: number) {
        this.totalValue = Math.min(this.totalValue + value, this.maxValue);
    }

    /**
     * Decreases the total value of the statistic by the specified value, capped at the minimum value.
     * @param {number} value - The value to decrease the statistic by.
     */
    decrease(value: number) {
        this.totalValue = Math.max(this.totalValue - value, this.minValue);
    }

    /**
     * Sets the total value of the statistic to the specified value, clamped between the minimum and maximum values.
     * @param {number} value - The value to set the statistic to.
     */
    set(value: number) {
        this.totalValue = Math.min(Math.max(value, this.minValue), this.maxValue);
    }

    /**
     * Resets the statistic to its base value and removes all modifiers.
     */
    reset() {
        this.totalValue = this.baseValue;
        this.modifiers = [];
    }

    /**
     * Adds a modifier or an array of modifiers to the statistic.
     * @param modifier The modifier(s) to add.
     */
    addModifier(modifier: Modifier | Modifier[]) {
        const modifiers = Array.isArray(modifier) ? modifier : [modifier];
        for (const mod of modifiers) {
            this.modifiers.push(mod);

            if (mod.effectType === ModifierEffectType.Overtime) {
                mod.intervalId = setInterval(() => {
                    if (mod.startTime + mod.applicationTime < Date.now())
                        clearInterval(mod.intervalId!);

                    this.totalValue = this.getModifiedValue();
                }, mod.applicationTick);
            }
            else
                this.totalValue = this.getModifiedValue();
        }
    }

    /**
     * Removes a modifier or an array of modifiers from the statistic.
     * @param modifier The modifier(s) to remove.
     */
    removeModifier(modifier: Modifier | Modifier[]) {
        const modifiers = Array.isArray(modifier) ? modifier : [modifier];
        this.modifiers = this.modifiers.filter(m => {
            if (modifiers.includes(m)) {
                if (m.intervalId) {
                    clearInterval(m.intervalId);
                    m.intervalId = null;
                }
                return false;
            }
            return true;
        });

        this.totalValue = this.getModifiedValue();
    }

    /**
     * Gets the minimum value of the statistic.
     * @returns The minimum value.
     */
    getMinValue() {
        return this.minValue;
    }

    /**
     * Gets the maximum value of the statistic.
     * @returns The maximum value.
     */
    getMaxValue() {
        return this.maxValue;
    }

    /**
     * Gets the total value of the statistic.
     * @returns The total value.
     */
    getTotalValue() {
        return this._totalValue;
    }

    /**
     * Gets the base value of the statistic.
     * @returns The base value.
     */
    getBaseValue() {
        return this.baseValue;
    }

    /**
     * Gets the modified value of the statistic, taking into account all modifiers.
     * @returns The modified value.
     */
    getModifiedValue() {
        let modifiedValue = this.baseValue;

        for (const modifier of this.modifiers) {
            modifiedValue = modifier.apply(modifiedValue);
        }

        return Math.min(modifiedValue, this.maxValue);
    }

    /**
     * Gets the percentage of the total value relative to the base value.
     * @returns The percentage.
     */
    getPercentage() {
        const percentage = (this.totalValue / this.baseValue) * 100;
        return Math.round(percentage * 100) / 100;
    }

    /**
     * Sets the base value of the statistic.
     * @param value The new base value.
     */
    setBaseValue(value: number) {
        this.baseValue = value;
        this.totalValue = this.getModifiedValue();
    }

    /**
     * Sets the maximum value of the statistic.
     * @param value The new maximum value.
     */
    setMaxValue(value: number) {
        this.maxValue = value;
    }
}

/**
 * Represents a modifier that can be applied to a statistic value.
 */
export class Modifier {
    type: ModifierType;
    value: number;
    effectType: ModifierEffectType;
    applicationTime: number;
    startTime: number;

    applicationTick: number;
    intervalId: NodeJS.Timeout | null = null;

    /**
     * Creates a new Modifier instance.
     * @param type The type of the modifier.
     * @param value The value of the modifier.
     * @param originType The origin type of the modifier.
     * @param originId The origin ID of the modifier.
     * @param effectType The effect type of the modifier. Default is ModifierEffectType.Instant.
     * @param applicationTime The application time of the modifier. Default is 1000.
     * @param applicationTick The application tick of the modifier. Default is 1000.
     */
    constructor(
        type: ModifierType,
        value: number,
        effectType: ModifierEffectType = ModifierEffectType.Instant,
        applicationTime: number = 1000,
        applicationTick: number = 1000
    ) {
        this.value = value;
        this.type = type;
        this.effectType = effectType;
        this.applicationTime = applicationTime;
        this.startTime = Date.now();

        this.applicationTick = applicationTick;
    }

    clone() {
        return new Modifier(this.type, this.value, this.effectType, this.applicationTime, this.applicationTick);
    }

    /**
     * Applies the modifier to a statistic value.
     * @param statisticValue The original statistic value.
     * @param value The value to apply. Default is the value of the modifier.
     * @param currentTime The current time. Default is the current system time.
     * @returns The modified statistic value.
     */
    apply(statisticValue: number, value: number = this.value, currentTime: number = Date.now()): number {
        switch (this.effectType) {
            case ModifierEffectType.Instant:
                return Number(this.applyInstant(statisticValue, value).toFixed(1));
            case ModifierEffectType.Overtime:
                return Number(this.applyOvertime(statisticValue, value, currentTime).toFixed(1));
            default:
                return Number(statisticValue.toFixed(1));
        }
    }

    /**
     * Applies the modifier instantly to a statistic value.
     * @param statisticValue The original statistic value.
     * @param value The value to apply.
     * @returns The modified statistic value.
     */
    applyInstant(statisticValue: number, value: number): number {
        switch (this.type) {
            case ModifierType.Additive:
                return statisticValue + value;
            case ModifierType.Negative:
                return statisticValue - value;
            case ModifierType.Percentual:
                return statisticValue * (1 + value / 100);
            case ModifierType.Multiplicator:
                return statisticValue * value;
            case ModifierType.Divisor:
                return statisticValue / value;
            default:
                return statisticValue;
        }
    }

    /**
     * Applies the modifier over time to a statistic value.
     * @param statisticValue The original statistic value.
     * @param value The value to apply.
     * @param currentTime The current time.
     * @returns The modified statistic value.
     */
    applyOvertime(statisticValue: number, value: number, currentTime: number): number {
        // Calculate elapsed time since the modifier was applied
        const elapsedTime = currentTime - this.startTime;

        // Calculate the fraction of the modifier's value to apply based on elapsed time
        const fraction = Math.min(1, elapsedTime / this.applicationTime);

        // Apply the fraction of the modifier's value
        switch (this.type) {
            case ModifierType.Additive:
                return statisticValue + value * fraction;
            case ModifierType.Negative:
                return statisticValue - value * fraction;
            case ModifierType.Percentual:
                return statisticValue * (1 + (value / 100) * fraction);
            case ModifierType.Multiplicator:
                return statisticValue * (1 + value * fraction);
            case ModifierType.Divisor:
                return statisticValue / (1 + value * fraction);
            default:
                return statisticValue;
        }
    }
}
