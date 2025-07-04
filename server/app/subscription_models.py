from app import db
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, Boolean, ForeignKey
from sqlalchemy.types import JSON

class AccessLevel(db.Model):
    __bind_key__ = 'users'
    __tablename__ = 'access_levels'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    max_containers = Column(Integer, default=3)
    features = Column(JSON)

class SubscriptionPlan(db.Model):
    __bind_key__ = 'users'
    __tablename__ = 'subscription_plans'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    price = Column(DECIMAL(10,2))
    access_level_id = Column(Integer, ForeignKey('access_levels.id'))
    duration_days = Column(Integer)

class UserSubscription(db.Model):
    __bind_key__ = 'users'
    __tablename__ = 'user_subscriptions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    plan_id = Column(Integer, ForeignKey('subscription_plans.id'))
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)