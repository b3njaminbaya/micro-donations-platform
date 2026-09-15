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

    # M-Pesa B2C (business-to-customer) — used to pay out a cause's raised
    # funds to its creator. INITIATOR_NAME is the Daraja API operator
    # username; SECURITY_CREDENTIAL is that operator's password encrypted
    # with Safaricom's public certificate, generated once offline per
    # Daraja's B2C setup docs (never the plaintext password).
    B2C_INITIATOR_NAME = os.getenv("MPESA_B2C_INITIATOR_NAME")
    B2C_SECURITY_CREDENTIAL = os.getenv("MPESA_B2C_SECURITY_CREDENTIAL")
    B2C_RESULT_URL = os.getenv("MPESA_B2C_RESULT_URL")
    B2C_TIMEOUT_URL = os.getenv("MPESA_B2C_TIMEOUT_URL")
    # Same shared-secret pattern as CALLBACK_SECRET, appended to both B2C URLs above.
    B2C_CALLBACK_SECRET = os.getenv("MPESA_B2C_CALLBACK_SECRET")
