import { Injectable } from '@nestjs/common';

@Injectable()
export class MetaTemplateBuilder {
  build(
    template: any,
    customFields: Record<string, any>,
  ) {
    const components: any[] = [];

    for (const component of template.components) {
      // HEADER
      if (component.type === 'HEADER') {
        // TEXT HEADER
        if (component.format === 'TEXT') {
          const parameters = this.extractVariables(
            component.text,
            customFields,
            template.parameterFormat,
          );

          if (parameters.length) {
            components.push({
              type: 'header',
              parameters,
            });
          }
        }

        // IMAGE HEADER
        if (component.format === 'IMAGE') {
          components.push({
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: this.buildMedia(
                  customFields,
                ),
              },
            ],
          });
        }

        // VIDEO HEADER
        if (component.format === 'VIDEO') {
          components.push({
            type: 'header',
            parameters: [
              {
                type: 'video',
                video: this.buildMedia(
                  customFields,
                ),
              },
            ],
          });
        }

        // DOCUMENT HEADER
        if (component.format === 'DOCUMENT') {
          components.push({
            type: 'header',
            parameters: [
              {
                type: 'document',
                document:
                  this.buildMedia(
                    customFields,
                  ),
              },
            ],
          });
        }
      }

      // BODY
      if (component.type === 'BODY') {
        const parameters =
          this.extractVariables(
            component.text,
            customFields,
            template.parameterFormat,
          );

        if (parameters.length) {
          components.push({
            type: 'body',
            parameters,
          });
        }
      }

      // BUTTONS
      if (component.type === 'BUTTONS') {
        component.buttons?.forEach(
          (button, index) => {
            if (
              button.type ===
              'URL'
            ) {
              components.push({
                type: 'button',
                sub_type: 'url',
                index:
                  String(index),
                parameters: [
                  {
                    type: 'text',
                    text: String(
                      customFields[
                        button.variable
                      ] ?? '',
                    ),
                  },
                ],
              });
            }
          },
        );
      }
    }

    return {
      name: template.name,

      language: {
        code:
          template.language,
      },

      components,
    };
  }

  private extractVariables(
    text: string,
    customFields: Record<string, any>,
    parameterFormat:
      | 'POSITIONAL'
      | 'NAMED' = 'POSITIONAL',
  ) {
    const matches =
      text.match(
        /\{\{([^}]+)\}\}/g,
      ) || [];

    return matches.map(
      (match) => {
        const variable =
          match
            .replace('{{', '')
            .replace('}}', '')
            .trim();

        // POSITIONAL
        if (
          parameterFormat ===
          'POSITIONAL'
        ) {
          const index =
            Number(variable) -
            1;

          return {
            type: 'text',
            text: String(
              customFields
                ?.variables?.[
                index
              ] ?? '',
            ),
          };
        }

        // NAMED
        return {
          type: 'text',
          text: String(
            customFields[
              variable
            ] ?? '',
          ),
        };
      },
    );
  }

  private buildMedia(
    customFields:
      Record<string, any>,
  ) {
    if (
      customFields.metaMediaId
    ) {
      return {
        id: customFields.metaMediaId,
      };
    }

    if (
      customFields.mediaLink
    ) {
      return {
        link: customFields.mediaLink,
      };
    }

    return {};
  }
}