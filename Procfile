web: FLASK_APP=server.app:create_app flask db upgrade && gunicorn -w 4 -b 0.0.0.0:5000 "server.app:create_app()"
