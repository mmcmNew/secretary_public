from flask import request, jsonify
from flask_jwt_extended import jwt_required, current_user

from . import journals
from .models import JournalEntry
from app import db


@journals.route('/<journal_type>', methods=['GET'])
@jwt_required()
def get_journals(journal_type):
    entries = JournalEntry.query.filter_by(user_id=current_user.id, journal_type=journal_type).all()
    return jsonify([e.to_dict() for e in entries])


@journals.route('/<journal_type>', methods=['POST'])
@jwt_required()
def create_journal(journal_type):
    data = request.get_json() or {}
    entry = JournalEntry(user_id=current_user.id, journal_type=journal_type, data=data)
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@journals.route('/<journal_type>/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_journal(journal_type, entry_id):
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=current_user.id, journal_type=journal_type).first_or_404()
    data = request.get_json() or {}
    entry.data = data
    db.session.commit()
    return jsonify(entry.to_dict())


@journals.route('/<journal_type>/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_journal(journal_type, entry_id):
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=current_user.id, journal_type=journal_type).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'result': 'OK'})
