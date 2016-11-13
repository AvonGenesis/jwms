import os
from flask import Flask, jsonify, request, Response
from faker import Factory
from twilio.access_token import AccessToken, IpMessagingGrant
import requests
import json

app = Flask(__name__)
fake = Factory.create()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/tone', methods=['POST'])
def tone():
    try:
        response = requests.post(
            url="https://gateway.watsonplatform.net/tone-analyzer/api/v3/tone",
            params={
                "version": "2016-05-19",
            },
            headers={
                "Cookie": "Watson-DPAT=NzBqFbCGlD4ph7A2PKfBPyNsICi4hJVNcMf74aJUfaX9A%2B2veWjtquIMEOslSPtCzpvuUlfumn5Wa24Olg5uAcPCBW6nJiH4uMhJWFGHQfZSU2JLA%2BCr3Lv38QRfYKsvk1U8LbTRnZSwsPa9HK%2Fkxwf6ZBvUBpyLiS9rB80wdU2pvHz7Jg0Vqjg5HIA3Tesh%2BCiKcW9OUFHfZfBMU0pzby7MDs9sTosQZdQxR9p%2BT2veMxBqzWV4NnSXYOMj6PeBEg5iKYpqvGT5E%2FDvRVlZrLfZj8D6M%2FwvQMKZcQLgWDjtbOeaRfGbzJh57SFwyt6d%2FxYJwzHhSMzR1qLh5%2FN88UKX%2FClLjF1Epa3a9kQ5mF8kCBZiW6t3%2FFUXEx7NfdzNnxvy5rg6g2RmffdIXhWDSrLVcDZZ0Xcpnj3hFrXMnopCjRbpmFNeTAG5nTBRdMIBVdIVpp%2BQH5h1m2oP8EHRSBwpa4UVRazAGPGz5HEHHYSO%2FvRdGZb9xyz3%2FCZ8rs9nhiRvmXNNJcHWs51K%2F6bTc1KGndapa%2BgQoQlhNb%2BISm%2Byk21O1ioPG5D5R%2B20rC2rD48uF6930ada0Dr%2BfV09pkXbKLEqCw9AG30Dq57LHf8ff6BTkyAsOrtFIjXOb5hfJLsyOiFfC%2Fq4bwhDzihs9s7wr7j1NHy0e3p9zUzv3q8NldgxCDbP0fYFdU%2FMFVGbJTTq5zoR5w2W5TlzlsYGKB9qGoWat%2BD2zgnxEW4JN8pwtbvY3OchcQcm05DkRwj2eWd8bAf%2Bbb%2BWucdYvivU5Z%2BFDu02z8B6W3%2BRZjfz4FKt1ugojB2u30l%2Bfdm%2BxSog2KVSPRyYk5RrnUlKb%2FKy5Fi0vcBm70mNC%2BjN%2Bm3hq9Y2%2BfDKWMURa5WzXW%2FgCE%2Fq%2FcTpfw42XTaPGsH8lggrRG4Zf7Gm86d9Krt%2FBkrTz2XjgQA8xxWvqJwvNCO38t5iRj4BFVaM9qM%3D",
                "Authorization": "Basic MDQ1MjE5ZDUtYzVjNC00ZTE0LTk0MDItMWY1OWJmOTY5OWE3OioqKioqIEhpZGRlbiBjcmVkZW50aWFscyAqKioqKg==",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "text": json.loads(request.data)['text']
            })
        )
        print('Response HTTP Status Code: {status_code}'.format(
            status_code=response.status_code))
        print('Response HTTP Response Body: {content}'.format(
            content=response.content))
        return Response(response.content, mimetype='application/json')
    except requests.exceptions.RequestException:
        print('HTTP Request failed')
    # json_data = json.loads(request.data)


@app.route('/token')
def token():

    # get credentials for environment variables
    account_sid = "ACcdbab0f13e08eb8b19b6d3025a9ad6f7"
    api_key = "SK2f52e17a9ca74d4714d28a7c575e1e21"
    api_secret = "6XYHaD6O5zPKDpM4wU34NknCQj7L1d6C"
    service_sid = "IS27b6d9077d6c48838881fc41b4748bb2"

    # create a randomly generated username for the client
    identity = request.args.get('identity')

    # Create a unique endpoint ID for the
    device_id = request.args.get('device')
    endpoint = "TwilioChatDemo:{0}:{1}".format(identity, device_id)

    # Create access token with credentials
    token = AccessToken(account_sid, api_key, api_secret, identity)

    # Create an IP Messaging grant and add to token
    ipm_grant = IpMessagingGrant(endpoint_id=endpoint, service_sid=service_sid)
    token.add_grant(ipm_grant)

    # Return token info as JSON
    return jsonify(identity=identity, token=token.to_jwt())

if __name__ == '__main__':
    #app.run(debug=True)
    port = os.getenv('PORT', '5000')
    app.run(host="0.0.0.0", port=int(port))
