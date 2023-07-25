import os
from wyze_sdk import Client

response = Client(email=os.environ['WYZELOCK_EMAIL'], password=os.environ['WYZELOCK_PASSWORD'], key_id=os.environ['WYZELOCK_KEY_ID'], api_key=os.environ['WYZELOCK_API_KEY'])
print('grez',response)
#print(f"access token: {response['access_token']}")
#print(f"refresh token: {response['refresh_token']}")
