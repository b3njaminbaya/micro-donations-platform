"""
Charges every due recurring donation via M-Pesa STK push.

Intended to run on a schedule (e.g. once a day) as a standalone process —
NOT inside the web dyno's request/response cycle, and not via an in-process
scheduler, since gunicorn runs multiple worker processes that would each try
to fire the same job. Wire this up as a platform cron job, for example a
Render "Cron Job" resource, running:

    python -m server.jobs.run_recurring_donations

A failed STK-push attempt leaves next_run_date untouched, so it's retried on
the next run rather than silently skipped.
"""
from datetime import date, datetime

from server.models import db, RecurringDonation, Donation
from server.services.mpesa_service import MpesaService
from server.jobs.schedule import advance


def run():
    due = (
        RecurringDonation.query
        .filter_by(status='active')
        .filter(RecurringDonation.next_run_date <= date.today())
        .all()
    )

    charged, failed = 0, 0
    for subscription in due:
        response = MpesaService.initiate_stk_push(
            subscription.phone_number, subscription.amount, subscription.cause_id
        )
        checkout_request_id = response.get("CheckoutRequestID")
        if not checkout_request_id:
            failed += 1
            print(f"[recurring-donations] subscription {subscription.id}: failed to start payment — {response}")
            continue

        donation = Donation(
            amount=subscription.amount,
            cause_id=subscription.cause_id,
            user_id=subscription.user_id,
            status='pending',
            checkout_request_id=checkout_request_id,
            recurring_donation_id=subscription.id,
        )
        db.session.add(donation)
        subscription.last_run_at = datetime.utcnow()
        subscription.next_run_date = advance(subscription.next_run_date, subscription.frequency)
        db.session.commit()
        charged += 1
        print(f"[recurring-donations] subscription {subscription.id}: STK push sent, awaiting M-Pesa confirmation")

    print(f"[recurring-donations] done: {charged} charged, {failed} failed, {len(due)} due")


if __name__ == "__main__":
    from server.app import create_app

    app = create_app()
    with app.app_context():
        run()
