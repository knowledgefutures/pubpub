<?xml version="1.0" encoding="UTF-8"?>
<stylesheet version="1.0"
            xmlns="http://www.w3.org/1999/XSL/Transform"
            xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <!-- documentation: http://www.refman.com/support/risformat_intro.asp -->
    <output method="text" encoding="utf-8"/>

    <variable name="month-abbreviations" select="'  janfebmaraprmayjunjulaugsepoctnovdec'"/>

    <template match="/">
        <apply-templates select="article/back/ref-list/ref"/>
    </template>
    
    <template name="extract-id">
        <choose>
            <when test="@id != ''">
                <apply-templates select="@id"/>
            </when>
            <when test="./../@id != ''">
                <call-template name="id-item">
                    <with-param name="value" select="./../@id"/>
                </call-template>
            </when>
            <otherwise>
                <call-template name="id-item">
                    <with-param name="value" select="../label/text()"/>
                </call-template>
            </otherwise>
        </choose>
    </template>

    <template match="mixed-citation|element-citation">
        <choose>
            <when test="@publication-type='journal' or @publication-type='article' or @publication-type='article-journal' or @publication-type='article-magazine' or @publication-type='article-newspaper'">
                <text>@article{</text>
                <call-template name="extract-id"/>
                <apply-templates select="article-title"/>
                <apply-templates select="person-group[@person-group-type='author']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="year"/>
                <apply-templates select="abstract"/>
                <apply-templates select="volume"/>
                <apply-templates select="issue"/>
                <apply-templates select="number"/>
                <apply-templates select="month"/>
                <apply-templates select="source|journal"/>
                <apply-templates select="fpage"/>
                <apply-templates select="pub-id[@pub-id-type='doi']"/>
                <apply-templates select="note|comment"/>
                <text>}</text>
            </when>
            <when test="@publication-type='book' or @publication-type='bill' or @publication-type='graphic' or @publication-type='legal_case' or @publication-type='legislation' or @publication-type='motion_picture' or @publication-type='report' or @publication-type='song'">
                <text>@book{</text>
                <call-template name="extract-id"/>
                <apply-templates select="source|title" mode="book"/>
                <apply-templates select="person-group[@person-group-type='author']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="year"/>
                <apply-templates select="volume"/>
                <apply-templates select="series"/>
                <apply-templates select="edition"/>
                <apply-templates select="month"/>
                <apply-templates select="isbn"/>
                <apply-templates select="publisher-name"/>
                <apply-templates select="address"/>
                <apply-templates select="organization"/>
                <apply-templates select="pub-id[@pub-id-type='doi']"/>
                <apply-templates select="note|comment"/>
                <text>}</text>
            </when>
            <when test="@publication-type='conference'">
                <text>@conference{</text>
                <call-template name="extract-id"/>
                <apply-templates select="source|title" mode="book"/>
                <apply-templates select="person-group[@person-group-type='author']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="year"/>
                <apply-templates select="volume"/>
                <apply-templates select="series"/>
                <apply-templates select="edition"/>
                <apply-templates select="month"/>
                <apply-templates select="isbn"/>
                <apply-templates select="publisher-name"/>
                <apply-templates select="address"/>
                <apply-templates select="organization"/>
                <apply-templates select="pub-id[@pub-id-type='doi']"/>
                <apply-templates select="note|comment"/>
                <text>}</text>
            </when>
            <when test="@publication-type='book-chapter' or @publication-type='inbook'">
                <text>@inbook{</text>
                <call-template name="extract-id"/>
                <apply-templates select="source|booktitle" mode="inbook"/>
                <apply-templates select="chapter-title|title" mode="inbook"/>
                <apply-templates select="chapter"/>
                <apply-templates select="person-group[@person-group-type='author']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="person-group[@person-group-type='translator']"/>
                <apply-templates select="year"/>
                <apply-templates select="volume"/>
                <apply-templates select="series"/>
                <apply-templates select="edition"/>
                <apply-templates select="month"/>
                <apply-templates select="isbn"/>
                <apply-templates select="publisher-name"/>
                <apply-templates select="address"/>
                <apply-templates select="fpage"/>
                <apply-templates select="pub-id[@pub-id-type='doi']"/>
                <apply-templates select="note|comment"/>
                <text>}</text>
            </when>
            <when test="@publication-type='thesis' or @publication-type='phdthesis'">
                <text>@phdthesis{</text>
                <call-template name="extract-id"/>
                <apply-templates select="source|title" mode="book"/>
                <apply-templates select="person-group[@person-group-type='author']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="person-group[@person-group-type='translator']"/>
                <apply-templates select="year"/>
                <apply-templates select="month"/>
                <apply-templates select="isbn"/>
                <apply-templates select="school"/>
                <apply-templates select="publisher-name"/>
                <apply-templates select="address"/>
                <apply-templates select="fpage"/>
                <apply-templates select="pub-id[@pub-id-type='doi']"/>
                <apply-templates select="note|comment"/>
                <text>}</text>
            </when>
            <otherwise>
                <text>@misc{</text>
                <call-template name="extract-id"/>
                <apply-templates select="person-group[@person-group-type='author']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="person-group[@person-group-type='editor']"/>
                <apply-templates select="year"/>
                <apply-templates select="number"/>
                <apply-templates select="month"/>
                <apply-templates select="ext-link"/>
                <apply-templates select="source|title" mode="book"/>
                <apply-templates select="pub-id[@pub-id-type='doi']"/>
                <apply-templates select="note|comment"/>
                <text>}</text>
            </otherwise>
        </choose>
    </template>

    <template name="id-item">
        <param name="value"/>
        <param name="suffix" select="','"/>
        <value-of select="concat('&#10; ', $value, $suffix, '&#10;')"/>
    </template>

    <template name="item">
        <param name="key"/>
        <param name="value"/>
        <param name="suffix" select="','"/>
        <value-of select="concat(' ', $key, ' = {', $value, '}', $suffix, '&#10;')"/>
    </template>

    <template match="pub-id[@pub-id-type='doi']">
        <call-template name="item">
            <with-param name="key">url</with-param>
            <with-param name="value" select="concat('https://doi.org/', .)"/>
        </call-template>

        <call-template name="item">
            <with-param name="key">doi</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="@id">
        <call-template name="id-item">
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="fpage">
        <call-template name="item">
            <with-param name="key">pages</with-param>
            <with-param name="value" select="concat(., '-', ../lpage)"/>
        </call-template>
    </template>

    <template match="publisher-name">
        <call-template name="item">
            <with-param name="key">publisher</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="series">
        <call-template name="item">
            <with-param name="key">series</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="address">
        <call-template name="item">
            <with-param name="key">address</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="school">
        <call-template name="item">
            <with-param name="key">school</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="organization">
        <call-template name="item">
            <with-param name="key">organization</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

	<template match="article-title">
        <call-template name="item">
            <with-param name="key">title</with-param>
            <with-param name="value">
                <apply-templates mode="markup"/>
            </with-param>
        </call-template>
    </template>

    <template match="source|journal">
        <call-template name="item">
            <with-param name="key">journal</with-param>
            <with-param name="value">
                <apply-templates mode="markup"/>
            </with-param>
        </call-template>
    </template>

    <template match="source|title" mode="book">
        <call-template name="item">
            <with-param name="key">title</with-param>
            <with-param name="value">
                <apply-templates mode="markup"/>
            </with-param>
        </call-template>
    </template>

    <template match="source|booktitle" mode="inbook">
        <call-template name="item">
            <with-param name="key">booktitle</with-param>
            <with-param name="value">
                <apply-templates mode="markup"/>
            </with-param>
        </call-template>
    </template>

    <template match="chapter-title|title" mode="inbook">
        <call-template name="item">
            <with-param name="key">title</with-param>
            <with-param name="value">
                <apply-templates mode="markup"/>
            </with-param>
        </call-template>
    </template>

    <template match="note|comment">
        <call-template name="item">
            <with-param name="key">note</with-param>
            <with-param name="value">
                <apply-templates mode="markup"/>
            </with-param>
        </call-template>
    </template>

    <template match="ext-link">
        <call-template name="item">
            <with-param name="key">url</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="person-group[@person-group-type='author']|person-group[@person-group-type='editor']|person-group[@person-group-type='translator']">
        <call-template name="item">
            <with-param name="key" select="@person-group-type"/>
            <with-param name="value">
                <apply-templates select="name"/>
                <apply-templates select="string-name"/>
            </with-param>
        </call-template>
    </template>

    <!-- contributors (authors and editors) -->
	<template match="name|string-name">
        <value-of select="surname"/>
        <apply-templates select="suffix" mode="name"/>
        <apply-templates select="given-names" mode="name"/>

        <if test="position() != last()">
            <value-of select="' and '"/>
        </if>
	</template>

    <template match="given-names | suffix" mode="name">
        <value-of select="concat(', ', .)"/>
    </template>

    <template match="pub-date">
        <apply-templates select="year"/>
        <apply-templates select="month"/>
    </template>

    <template match="year | volume | number | issue | edition | chapter">
        <call-template name="item">
            <with-param name="key" select="local-name()"/>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <template match="month">
        <call-template name="item">
            <with-param name="key" select="local-name()"/>
            <with-param name="value">
                <value-of select="substring($month-abbreviations, number(@number) * 3, 3)"/>
            </with-param>
        </call-template>
    </template>

    <template match="issn">
        <choose>
            <when test=".='0000-0000'">
                <!-- miss out the placeholder ISSN - 0000-0000 -->
            </when>
            <otherwise>
                <call-template name="item">
                    <with-param name="key">issn</with-param>
                    <with-param name="value" select="."/>
                </call-template>
            </otherwise>
        </choose>
    </template>

    <template match="isbn">
        <call-template name="item">
            <with-param name="key">isbn</with-param>
            <with-param name="value" select="."/>
        </call-template>
    </template>

    <!-- formatting markup -->
    <!-- see http://www.tei-c.org/release/doc/tei-xsl-common2/slides/teilatex-slides3.html -->

    <template match="*" mode="markup">
        <xsl:apply-templates mode="markup"/>
    </template>

    <!--<template match="bold" mode="markup">
        <xsl:text>\textbf{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="italic" mode="markup">
        <xsl:text>\textit{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="underline" mode="markup">
        <xsl:text>\uline{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="overline" mode="markup">
        <xsl:text>\textoverbar{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="sup" mode="markup">
        <xsl:text>\textsuperscript{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="sub" mode="markup">
        <xsl:text>\textsubscript{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="sc" mode="markup">
        <xsl:text>\textsc{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>

    <template match="monospace" mode="markup">
        <xsl:text>\texttt{</xsl:text>
        <xsl:apply-templates mode="markup"/>
        <xsl:text>}</xsl:text>
    </template>-->
</stylesheet>
