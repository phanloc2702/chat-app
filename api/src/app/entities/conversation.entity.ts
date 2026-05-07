import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ConversationMember } from './conversation-member.entity';
import { Message } from './message.entity';
import { Notification } from './notification.entity';

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: ConversationType,
  })
  type!: ConversationType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdById!: number | null;

  @ManyToOne(() => User, (user) => user.createdConversations, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;

  @Column({ name: 'last_message_id', type: 'int', nullable: true })
  lastMessageId!: number | null;

  @ManyToOne(() => Message, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'last_message_id' })
  lastMessage!: Message | null;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members!: ConversationMember[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];

  @OneToMany(() => Notification, (notification) => notification.relatedConversation)
  notifications!: Notification[];
}