from datetime import timedelta


def advance(from_date, frequency):
    """The next run date for a recurring donation, given its frequency."""
    if frequency == "weekly":
        return from_date + timedelta(weeks=1)
    if frequency == "monthly":
        # Fixed 30-day cadence rather than calendar-month arithmetic, so every
        # frequency is a simple, predictable timedelta with no month-length
        # or end-of-month edge cases.
        return from_date + timedelta(days=30)
    raise ValueError(f"Unknown frequency: {frequency!r}")
