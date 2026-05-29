import { Injectable } from "@nestjs/common";

@Injectable()
export class MetaTemplateBuilder {

  build(
    template: any,
    customFields: Record<string, any>,
  ) {

    const components: any[] = [];

    for (const component of template.components) {

      // HEADER
      if (
        component.type === 'HEADER'
      ) {

        if (
          component.format === 'TEXT'
        ) {

          const parameters =
            this.extractVariables(
              component.text,
              customFields,
            );

          if (parameters.length) {

            components.push({
              type: 'header',
              parameters,
            });
          }
        }

        if (
          component.format === 'IMAGE'
        ) {

          components.push({
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link:
                    customFields.imageUrl,
                },
              },
            ],
          });
        }

        if (
          component.format === 'DOCUMENT'
        ) {

          components.push({
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: {
                  link:
                    customFields.documentUrl,
                },
              },
            ],
          });
        }
      }

      // BODY
      if (
        component.type === 'BODY'
      ) {

        const parameters =
          this.extractVariables(
            component.text,
            customFields,
          );

        components.push({
          type: 'body',
          parameters,
        });
      }

      // BUTTONS
      if (
        component.type === 'BUTTONS'
      ) {

        component.buttons?.forEach(
          (
            button,
            index,
          ) => {

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
                    text:
                      customFields[
                        button.variable
                      ],
                  },
                ],
              });
            }
          },
        );
      }
    }

    return {

      name:
        template.name,

      language: {
        code:
          template.language,
      },

      components,
    };
  }

  private extractVariables(
    text: string,
    customFields:
      Record<string, any>,
  ) {

    const matches =
      text.match(
        /\{\{\d+\}\}/g,
      ) || [];

    const keys =
      Object.keys(
        customFields,
      );

    return matches.map(
      (_, index) => ({
        type: 'text',
        text:
          String(
            customFields[
              keys[index]
            ] || '',
          ),
      }),
    );
  }
}