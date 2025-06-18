from flask import jsonify, request
from . import messengers
from .handlers import post_records_to_socials


@messengers.route('/post_record_to_socials', methods=['POST'])
def post_records_to_socials_route():
    data = request.get_json()
    result, status_code = post_records_to_socials(data)
    return jsonify(result), status_code
