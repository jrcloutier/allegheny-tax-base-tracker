# Overview

The tax base in Allegheny County shifts as buildings are constructed, others are demolished, and property owners appeal their assessments. These changes are reflected on a county [webpage](https://apps.alleghenycounty.us/website/GeneralInfo.asp) that is updated every Friday.

This dashboard tracks weekly shifts in real estate values and measures the impacts on tax revenue. It is powered by a [scraper](https://github.com/PittsburghPG/scraper-allegheny-county-muni-profiles) that pulls data from the county every week.

The dashboard shows three categories of real estate value:

-  Taxable value is the total real estate value that is subject to property taxes.
-  Tax-exempt value is the total value that is exempt from property taxes.
-  PURTA covers the value of utilities taxed under a separate state formula.

The estimated tax impact multiplies each municipality's change in taxable value by its millage rate. This shows how much more or less revenue the municipality could collect if rates stay the same.

The tax base in Allegheny County shifts as buildings are built, others are demolished, and property owners appeal their assessments. These changes are reflected on a county webpage that is updated every Friday.

This dashboard tracks weekly shifts in real estate values and measures the impacts on tax revenue. It is powered by a scraper that pulls data from the county every week.

### Changelog

**Feb. 16, 2025**: added coverable info button to summary cards; upgraded chart tooltip to show both YTD and weekly change; added ability to see YTD and weekly change in municipality summary table. 
