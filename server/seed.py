from server.models import db, User, Cause, Donation, Reward, UserReward, RecurringDonation, Comment


def seed():
    try:
        # Children before parents, so this is safe whether or not the DB enforces FKs.
        UserReward.query.delete()
        Comment.query.delete()
        Donation.query.delete()
        RecurringDonation.query.delete()
        Reward.query.delete()
        Cause.query.delete()
        User.query.delete()
        db.session.commit()

        donor = User(name="Jane Donor", email="donor@example.com")
        donor.set_password("password123")

        recipient = User(name="Rainforest Trust Kenya", email="recipient@example.com")
        recipient.set_password("recipientpass")

        admin = User(name="Platform Admin", email="admin@example.com", role="admin")
        admin.set_password("adminpass123")

        db.session.add_all([donor, recipient, admin])
        db.session.commit()

        causes = [
            Cause(
                title="Save the Rainforest",
                description="Help us protect the rainforest and combat deforestation.",
                goal_amount=10000.0,
                category="Environment",
                country="Brazil",
                image_url="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
                user_id=recipient.id,
            ),
            Cause(
                title="Educate Underprivileged Children",
                description="Provide quality education to children in need.",
                goal_amount=5000.0,
                category="Education",
                country="Kenya",
                image_url="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800",
                user_id=recipient.id,
            ),
            Cause(
                title="Clean Water for Villages",
                description="Providing access to clean and safe drinking water.",
                goal_amount=8000.0,
                category="Health",
                country="Kenya",
                image_url="https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800",
                user_id=recipient.id,
            ),
        ]
        db.session.add_all(causes)
        db.session.commit()

        donations = [
            Donation(amount=50.0, user_id=donor.id, cause_id=causes[0].id),
            Donation(amount=100.0, user_id=donor.id, cause_id=causes[1].id),
        ]
        db.session.add_all(donations)
        db.session.commit()

        rewards = [
            Reward(
                title="Digital Thank-You Certificate",
                description="A personalized certificate recognizing your support.",
                points_required=100,
            ),
            Reward(
                title="Micro-Donations Sticker Pack",
                description="A set of stickers mailed to a donor-supplied address.",
                points_required=500,
            ),
            Reward(
                title="Featured Supporter Shoutout",
                description="Your name featured on the cause page you've supported most.",
                points_required=1500,
            ),
        ]
        db.session.add_all(rewards)
        db.session.commit()

        print("Database seeded successfully.")
    except Exception as e:
        db.session.rollback()
        print(f"Seeding failed: {e}")
        raise


if __name__ == "__main__":
    from server.app import create_app
    app = create_app()
    with app.app_context():
        seed()
