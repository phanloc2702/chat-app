import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity('conversation_members')
@Unique('UQ_conversation_user', ['conversationId', 'userId'])
@Index('IDX_conversation_members_conversation_user', [
  'conversationId',
  'userId',
])
export class ConversationMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'conversation_id', type: 'int' })
  conversationId!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.conversationMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;

  @Column({
    name: 'last_read_at',
    type: 'timestamp',
    nullable: true,
  })
  lastReadAt!: Date | null;
}