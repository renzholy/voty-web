import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import dynamic from 'next/dynamic'

import { Authorized, Community, communitySchema } from '../src/schemas'
import DurationInput from './basic/duration-input'
import TextInput from './basic/text-input'
import Textarea from './basic/textarea'
import BooleanSetsBlock from './boolean-sets-block'
import NumberSetsBlock from './number-sets-block'
import { Form, FormFooter, FormSection, FormItem } from './basic/form'
import { Grid6, GridItem3, GridItem6 } from './basic/grid'

const SigningButton = dynamic(() => import('./signing-button'), { ssr: false })

const defaultAnnouncementPeriod = 3600

const defaultVotingPeriod = 86400

export default function GroupForm(props: {
  community: Authorized<Community>
  group: string
  onSuccess: () => void
  disabled?: boolean
  className?: string
}) {
  const { onSuccess } = props
  const methods = useForm<Community>({
    resolver: zodResolver(communitySchema),
  })
  const {
    control,
    register,
    reset,
    formState: { errors },
  } = methods
  const { append } = useFieldArray({
    control,
    name: 'groups',
  })
  useEffect(() => {
    reset(props.community)
  }, [props.community, reset])
  const groupIndex = useMemo(() => {
    const index = props.community?.groups?.findIndex(
      (g) => g.extension.id === props.group,
    )
    if (index === undefined) {
      return props.community?.groups?.length || 0
    }
    return index
  }, [props.community?.groups, props.group])
  const isNewGroup = useMemo(
    () => !props.community?.groups?.find((g) => g.extension.id === props.group),
    [props.community.groups, props.group],
  )
  useEffect(() => {
    if (isNewGroup) {
      append({
        name: '',
        permission: {
          proposing: {
            operation: 'or',
            operands: [],
          },
          voting: {
            operation: 'max',
            operands: [],
          },
        },
        period: {
          announcement: defaultAnnouncementPeriod,
          voting: defaultVotingPeriod,
        },
        extension: {
          id: props.group,
        },
      })
    }
  }, [append, isNewGroup, props.group])

  return (
    <Form className={props.className}>
      <FormSection
        title="Profile"
        description="Basic information of the group."
      >
        <Grid6>
          <GridItem6>
            <FormItem
              label="Name"
              error={errors.groups?.[groupIndex]?.name?.message}
            >
              <TextInput
                {...register(`groups.${groupIndex}.name`)}
                error={!!errors.groups?.[groupIndex]?.name?.message}
                disabled={props.disabled}
              />
            </FormItem>
          </GridItem6>
          <GridItem6>
            <FormItem
              label="About"
              description="Styling with Markdown is supported"
              error={errors.groups?.[groupIndex]?.extension?.about?.message}
            >
              <Textarea
                {...register(`groups.${groupIndex}.extension.about`)}
                error={!!errors.groups?.[groupIndex]?.extension?.about?.message}
                disabled={props.disabled}
              />
            </FormItem>
          </GridItem6>
        </Grid6>
      </FormSection>
      <FormSection
        title="Proposers"
        description="Filters for proposal validation."
      >
        <Grid6>
          <GridItem6>
            <FormItem
              error={
                errors.groups?.[groupIndex]?.permission?.proposing
                  ? JSON.stringify(
                      errors.groups?.[groupIndex]?.permission?.proposing,
                    )
                  : undefined
              }
            >
              <FormProvider {...methods}>
                <BooleanSetsBlock
                  name="proposing"
                  entry={props.community.author.did}
                  groupIndex={groupIndex}
                  disabled={props.disabled}
                />
              </FormProvider>
            </FormItem>
          </GridItem6>
        </Grid6>
      </FormSection>
      <FormSection
        title="Voters"
        description="Voting power is calculated as maximum."
      >
        <Grid6>
          <GridItem6>
            <FormItem
              error={
                errors?.groups?.[groupIndex]?.permission?.voting
                  ? JSON.stringify(
                      errors?.groups?.[groupIndex]?.permission?.voting,
                    )
                  : undefined
              }
            >
              <FormProvider {...methods}>
                <NumberSetsBlock
                  name="voting"
                  entry={props.community.author.did}
                  groupIndex={groupIndex}
                  disabled={props.disabled}
                />
              </FormProvider>
            </FormItem>
          </GridItem6>
        </Grid6>
      </FormSection>
      <FormSection title="Rules" description="Proposal timing.">
        <Grid6>
          <GridItem3>
            <FormItem
              label="Duration of announcement"
              error={
                errors?.groups?.[groupIndex]?.period?.announcement?.message
              }
            >
              <Controller
                defaultValue={defaultAnnouncementPeriod}
                control={control}
                name={`groups.${groupIndex}.period.announcement`}
                render={({ field: { value, onChange } }) => (
                  <DurationInput
                    value={value}
                    onChange={onChange}
                    disabled={props.disabled}
                    error={!!errors?.groups?.[groupIndex]?.period?.announcement}
                  />
                )}
              />
            </FormItem>
          </GridItem3>
          <GridItem3>
            <FormItem
              label="Duration of voting"
              error={errors?.groups?.[groupIndex]?.period?.voting?.message}
            >
              <Controller
                defaultValue={defaultVotingPeriod}
                control={control}
                name={`groups.${groupIndex}.period.voting`}
                render={({ field: { value, onChange } }) => (
                  <DurationInput
                    value={value}
                    onChange={onChange}
                    disabled={props.disabled}
                    error={!!errors?.groups?.[groupIndex]?.period?.voting}
                  />
                )}
              />
            </FormItem>
          </GridItem3>
        </Grid6>
      </FormSection>
      <FormFooter>
        <FormProvider {...methods}>
          <SigningButton
            did={props.community.author.did}
            onSuccess={onSuccess}
            disabled={props.disabled}
          >
            {isNewGroup ? 'Create' : 'Submit'}
          </SigningButton>
        </FormProvider>
      </FormFooter>
    </Form>
  )
}
