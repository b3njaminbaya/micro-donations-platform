import requests
import base64
from datetime import datetime
from server.config import Config

REQUIRED_SETTINGS = (
    "MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE", "MPESA_PASSKEY", "CALLBACK_URL",
)


class MpesaConfigError(Exception):
    """Raised when required M-Pesa settings are missing."""


class MpesaService:
    @staticmethod
    def _check_config():
        missing = [name for name in REQUIRED_SETTINGS if not getattr(Config, name)]
        if missing:
            raise MpesaConfigError(f"Missing M-Pesa configuration: {', '.join(missing)}")

    @staticmethod
    def get_access_token():
        """Get M-Pesa API access token. Returns None if the request fails or the response isn't JSON."""
        url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        auth = (Config.MPESA_CONSUMER_KEY, Config.MPESA_CONSUMER_SECRET)
        try:
            response = requests.get(url, auth=auth, timeout=10)
            response.raise_for_status()
            return response.json().get("access_token")
        except (requests.RequestException, ValueError):
            return None

    @staticmethod
    def generate_password():
        """Generate the password for STK push request."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        data_to_encode = Config.MPESA_SHORTCODE + Config.MPESA_PASSKEY + timestamp
        encoded_string = base64.b64encode(data_to_encode.encode()).decode()
        return encoded_string, timestamp

    @staticmethod
    def initiate_stk_push(phone_number, amount, cause_id):
        """
        Initiate an M-Pesa STK push transaction.
        Returns a dict. On any failure it has no 'CheckoutRequestID' key and
        an 'error' key instead, so callers can check for that rather than
        needing to handle exceptions.
        """
        try:
            MpesaService._check_config()
        except MpesaConfigError as e:
            return {"error": str(e)}

        access_token = MpesaService.get_access_token()
        if not access_token:
            return {"error": "Could not authenticate with M-Pesa"}

        password, timestamp = MpesaService.generate_password()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "BusinessShortCode": Config.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": Config.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": Config.CALLBACK_URL,
            "AccountReference": f"Cause-{cause_id}",
            "TransactionDesc": "Donation",
        }

        try:
            response = requests.post(
                "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers=headers,
                timeout=10,
            )
            return response.json()
        except (requests.RequestException, ValueError) as e:
            return {"error": f"M-Pesa request failed: {e}"}
