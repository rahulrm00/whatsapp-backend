import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class TemplateValidatorService {

  validate(dto: any) {

    this.validateName(
      dto.name,
    );

    this.validateComponents(
      dto.components,
    );

    this.validateVariables(
      dto.components,
      dto.parameterFormat,
    );

    this.validateBodyComponent(
      dto.components,
    );

    this.validateButtons(
      dto.components,
    );
  }

  // =========================
  // TEMPLATE NAME VALIDATION
  // =========================

  validateName(
    name: string,
  ) {

    if (
      !/^[a-z0-9_]+$/.test(name)
    ) {

      throw new BadRequestException(

        'Template name must contain lowercase letters, numbers and underscores only',
      );
    }

    if (
      name.length < 3 ||
      name.length > 512
    ) {

      throw new BadRequestException(

        'Template name length invalid',
      );
    }
  }

  // =========================
  // COMPONENT VALIDATION
  // =========================

  validateComponents(
    components: any[],
  ) {

    if (
      !components ||
      !components.length
    ) {

      throw new BadRequestException(

        'At least one component required',
      );
    }
  }

  // =========================
  // BODY VALIDATION
  // =========================

  validateBodyComponent(
    components: any[],
  ) {

    const body =
      components.find(
        (component) =>
          component.type === 'BODY',
      );

    if (!body) {

      throw new BadRequestException(

        'BODY component required',
      );
    }

    if (
      !body.text ||
      !body.text.trim()
    ) {

      throw new BadRequestException(

        'BODY text required',
      );
    }

    if (
      body.text.length > 1024
    ) {

      throw new BadRequestException(

        'BODY text too long',
      );
    }
  }

  // =========================
  // VARIABLE VALIDATION
  // =========================

  validateVariables(
    components: any[],
    parameterFormat: string,
  ) {

    for (const component of components) {

      if (!component.text) {
        continue;
      }

      const matches =
        component.text.match(
          /{{(.*?)}}/g,
        ) || [];

      // POSITIONAL

      if (
        parameterFormat ===
        'POSITIONAL'
      ) {

        const numbers =
          matches.map(
            (item) =>

              Number(
                item.replace(
                  /[{}]/g,
                  '',
                ),
              ),
          );

        numbers.forEach(
          (
            num,
            index,
          ) => {

            if (
              num !== index + 1
            ) {

              throw new BadRequestException(

                'Positional variables must be sequential',
              );
            }
          },
        );
      }

      // NAMED

      if (
        parameterFormat ===
        'NAMED'
      ) {

        const names =
          matches.map(
            (item) =>
              item.replace(
                /[{}]/g,
                '',
              ),
          );

        const unique =
          new Set(names);

        if (
          unique.size !==
          names.length
        ) {

          throw new BadRequestException(

            'Duplicate named variables found',
          );
        }

        names.forEach(
          (name) => {

            if (
              !/^[a-z_]+$/.test(
                name,
              )
            ) {

              throw new BadRequestException(

                'Named variables must contain lowercase letters and underscores only',
              );
            }
          },
        );
      }
    }
  }

  // =========================
  // BUTTON VALIDATION
  // =========================

  validateButtons(
    components: any[],
  ) {

    const buttonComponent =
      components.find(
        (component) =>
          component.type ===
          'BUTTONS',
      );

    if (!buttonComponent) {
      return;
    }

    const buttons =
      buttonComponent.buttons ||
      [];

    if (
      buttons.length > 10
    ) {

      throw new BadRequestException(

        'Maximum 10 buttons allowed',
      );
    }
  }
}