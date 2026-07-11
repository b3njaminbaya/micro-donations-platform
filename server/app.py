from dotenv import load_dotenv
load_dotenv()
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from server.models import db
from server.routes.auth_routes import auth_bp
from server.routes.cause_routes import cause_bp
from server.routes.donation_routes import donation_bp
from server.routes.mpesa_routes import mpesa_bp
from server.routes.comment_routes import comment_bp
from server.routes.reward_routes import reward_bp
from server.routes.recurring_donation_routes import recurring_bp
from server.routes.admin_user_routes import admin_user_bp


def create_app():
    app = Flask(__name__)

    # Load config from environment or fallback
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        # Local fallback to SQLite
        basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        instance_path = os.path.join(basedir, 'instance')
        os.makedirs(instance_path, exist_ok=True)
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(instance_path, 'micro_donations.db')}"

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        is_dev = os.getenv("FLASK_DEBUG") == "1" or os.getenv("FLASK_ENV") == "development"
        if is_dev:
            secret_key = "dev-only-insecure-secret-key"
        else:
            raise RuntimeError(
                "SECRET_KEY environment variable is required outside local development. "
                "Set it before starting the app (see .env.example)."
            )
    app.config['JWT_SECRET_KEY'] = secret_key

    db.init_app(app)
    # Hardcoded so `flask db ...` finds migrations regardless of the process's
    # working directory, since this app is always imported as `server.app`.
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    migrate = Migrate(app, db, directory=migrations_dir)
    CORS(app)
    jwt = JWTManager(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(cause_bp, url_prefix='/api')
    app.register_blueprint(donation_bp, url_prefix='/api')
    app.register_blueprint(mpesa_bp, url_prefix='/api')
    app.register_blueprint(comment_bp, url_prefix='/api')
    app.register_blueprint(reward_bp, url_prefix='/api')
    app.register_blueprint(recurring_bp, url_prefix='/api')
    app.register_blueprint(admin_user_bp, url_prefix='/api')

    @app.route('/')
    def home():
        return {"message": "Welcome to the Micro-Donations API!"}

    return app