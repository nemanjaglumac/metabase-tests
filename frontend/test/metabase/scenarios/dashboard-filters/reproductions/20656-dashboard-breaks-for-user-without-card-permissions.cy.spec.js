import { restore, filterWidget } from "__support__/e2e/cypress";
import { SAMPLE_DATABASE } from "__support__/e2e/cypress_sample_database";

const { PRODUCTS, PRODUCTS_ID } = SAMPLE_DATABASE;

const filter = {
  name: "ID",
  slug: "id",
  id: "11d79abe",
  type: "id",
  sectionId: "id",
};

describe.skip("issue 20656", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should allow a user to visit a dashboard even without a permission to see the dashboard card (metabase#20656)", () => {
    cy.createQuestionAndDashboard({
      questionDetails: {
        query: { "source-table": PRODUCTS_ID, limit: 2 },
        // Admin's personal collection is always the first one (hence, the id 1)
        collection_id: 1,
      },
    }).then(({ body: { id, card_id, dashboard_id } }) => {
      cy.addFilterToDashboard({ filter, dashboard_id });

      cy.request("PUT", `/api/dashboard/${dashboard_id}/cards`, {
        cards: [
          {
            id,
            card_id,
            row: 0,
            col: 0,
            sizeX: 18,
            sizeY: 10,
            parameter_mappings: [
              {
                parameter_id: filter.id,
                card_id,
                target: ["dimension", ["field", PRODUCTS.ID, null]],
              },
            ],
          },
        ],
      });

      cy.signInAsNormalUser();

      cy.visit(`/dashboard/${dashboard_id}`);
    });

    // Make sure the filter widget is there
    filterWidget();

    cy.findByText("Sorry, you don't have permissions to see this card.");
  });
});
