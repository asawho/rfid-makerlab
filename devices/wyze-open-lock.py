#!/usr/bin/python3
# Requires global pip install of wyze-sdk and click
# sudo apt install python3-pip
# python3 -m pip install click wyze-sdk

import click, os, time
from wyze_sdk import Client
from wyze_sdk.errors import WyzeApiError

@click.command()
@click.argument('email', required=True)
@click.argument('password', required=True)
@click.argument('device_mac', required=True)
def main(email, password, device_mac):
    client = Client(email=email, password=password)
    client.locks.unlock(device_mac=device_mac)
    print('Unlocked')
    # For later, doesn't work anyway
    # lock = client.locks.info(device_mac='')
    # if lock is not None:
    #     print(f"is open: {lock.is_open}")
    #     print(f"is locked: {lock.is_locked}")

main.main()