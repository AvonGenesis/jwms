import os
from flask import Flask, jsonify, request
from faker import Factory
from twilio.access_token import AccessToken, IpMessagingGrant

app = Flask(__name__)
fake = Factory.create()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/token')
def token():
    # get credentials for environment variables
    account_sid = "ACcdbab0f13e08eb8b19b6d3025a9ad6f7"
    api_key = "SK2f52e17a9ca74d4714d28a7c575e1e21"
    api_secret = "6XYHaD6O5zPKDpM4wU34NknCQj7L1d6C"
    service_sid = "IS27b6d9077d6c48838881fc41b4748bb2"

    # create a randomly generated username for the client
    identity = fake.user_name()

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
