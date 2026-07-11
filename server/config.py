import os


class Config:
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY")
    CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")
    # Appended as ?token=<secret> to CALLBACK_URL and checked on the way back in,
    # since Safaricom's callback has no other verifiable signature. Optional: if
    # unset, the callback accepts any request (fine for sandbox, not for production).
    CALLBACK_SECRET = os.getenv("MPESA_CALLBACK_SECRET")
