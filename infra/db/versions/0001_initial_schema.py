"""Initial schema

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create battles table
    op.create_table('battles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('mc_a', sa.String(), nullable=False),
        sa.Column('mc_b', sa.String(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('SCHEDULED', 'OPEN', 'CLOSED', name='battlestatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_battles_event_id'), 'battles', ['event_id'], unique=False)
    
    # Create votes table
    op.create_table('votes',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('battle_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('choice', sa.Enum('A', 'B', name='votechoice'), nullable=False),
        sa.Column('device_hash', sa.String(), nullable=False),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('battle_id', 'device_hash', name='unique_battle_device_vote')
    )
    op.create_index('idx_battle_choice', 'votes', ['battle_id', 'choice'], unique=False)
    op.create_index(op.f('ix_votes_battle_id'), 'votes', ['battle_id'], unique=False)
    
    # Create invalidations table
    op.create_table('invalidations',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('vote_id', sa.BigInteger(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('invalidations')
    op.drop_index(op.f('ix_votes_battle_id'), table_name='votes')
    op.drop_index('idx_battle_choice', table_name='votes')
    op.drop_table('votes')
    op.drop_index(op.f('ix_battles_event_id'), table_name='battles')
    op.drop_table('battles')
