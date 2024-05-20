"""Nombre del archivo

Revision ID: 1c8ab78ff006
Revises: f8558af0ad52
Create Date: 2024-05-20 00:20:59.432904

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c8ab78ff006'
down_revision = 'f8558af0ad52'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('consentimientos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('audio_filename', sa.String(length=255), nullable=True))
        batch_op.drop_column('audio_consentimiento')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('consentimientos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('audio_consentimiento', sa.BLOB(), nullable=True))
        batch_op.drop_column('audio_filename')

    # ### end Alembic commands ###
