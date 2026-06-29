import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type RuleConditionField = 'platform' | 'keyword' | 'contactId';
export type RuleConditionOperator = 'equals' | 'contains';

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

export type RuleAction = 'assign_agent';

@Entity('routing_rules')
export class RoutingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  conditions: RuleCondition[];

  @Column()
  action: RuleAction;

  @Column({ nullable: true })
  assignedAgentId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
